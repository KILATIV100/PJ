/**
 * Nova Poshta Routes
 * API маршрути для інтеграції з Нова Пошта
 */

const express = require('express');
const router = express.Router();
const NovaPoshtaService = require('../services/nova-poshta');
const Order = require('../models/Order');

/**
 * GET /api/novaposhta/cities
 * Отримати список міст
 */
router.get('/cities', async (req, res) => {
  try {
    const { search = '' } = req.query;
    const result = await NovaPoshtaService.getCities(search);

    res.json({
      success: result.success,
      cities: result.cities || [],
      message: result.message
    });
  } catch (error) {
    console.error('Помилка отримання міст:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/novaposhta/departments/:cityRef
 * Отримати список відділень для міста
 */
router.get('/departments/:cityRef', async (req, res) => {
  try {
    const { cityRef } = req.params;

    if (!cityRef) {
      return res.status(400).json({
        success: false,
        message: 'Необхідно вказати cityRef'
      });
    }

    const result = await NovaPoshtaService.getDepartments(cityRef);

    res.json({
      success: result.success,
      departments: result.departments || [],
      message: result.message
    });
  } catch (error) {
    console.error('Помилка отримання відділень:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/novaposhta/calculate
 * Розрахувати вартість доставки
 */
router.post('/calculate', async (req, res) => {
  try {
    const {
      senderCityRef,
      recipientCityRef,
      weight = 1,
      serviceType = '2',
      carriageType = '1'
    } = req.body;

    if (!senderCityRef || !recipientCityRef) {
      return res.status(400).json({
        success: false,
        message: 'Необхідно вказати міста відправника та одержувача'
      });
    }

    const result = await NovaPoshtaService.calculateShipping({
      senderCityRef,
      recipientCityRef,
      weight,
      serviceType,
      carriageType
    });

    res.json({
      success: result.success,
      cost: result.cost,
      estimatedDays: result.estimatedDays,
      message: result.message
    });
  } catch (error) {
    console.error('Помилка розрахунку доставки:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/novaposhta/shipment/create
 * Створити нову посилку
 */
router.post('/shipment/create', async (req, res) => {
  try {
    const {
      orderId,
      weight = 1,
      senderCity,
      recipientCity,
      recipientDepartment,
      cost = 0,
      description
    } = req.body;

    // Отримати замовлення з бази даних
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Замовлення не знайдено'
      });
    }

    // Перевірити наявність даних
    if (!senderCity || !recipientCity || !recipientDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Необхідно вказати міста та відділення'
      });
    }

    // Створити посилку через Nova Poshta
    const result = await NovaPoshtaService.createShipment({
      senderCity,
      recipientCity,
      recipientDepartment,
      weight,
      cost,
      description: description || `Замовлення ${order.orderNumber}`
    });

    if (result.success) {
      // Оновити замовлення з інформацією про доставку
      order.delivery = {
        method: 'novaposhta',
        trackingNumber: result.trackingNumber,
        shipmentRef: result.shipmentRef,
        status: 'created',
        cost: cost,
        city: recipientCity,
        department: recipientDepartment,
        createdAt: new Date()
      };

      await order.save();
    }

    res.json({
      success: result.success,
      shipmentRef: result.shipmentRef,
      trackingNumber: result.trackingNumber,
      message: result.message
    });
  } catch (error) {
    console.error('Помилка створення посилки:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/novaposhta/shipment/status/:trackingNumber
 * Отримати статус посилки
 */
router.get('/shipment/status/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Необхідно вказати трек-номер'
      });
    }

    const result = await NovaPoshtaService.getShipmentStatus(trackingNumber);

    res.json({
      success: result.success,
      status: result.status,
      statusDescription: result.statusDescription,
      lastEventCity: result.lastEventCity,
      lastEventDescription: result.lastEventDescription,
      message: result.message
    });
  } catch (error) {
    console.error('Помилка отримання статусу:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/novaposhta/order/:orderId/status
 * Отримати статус доставки замовлення
 */
router.get('/order/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Замовлення не знайдено'
      });
    }

    if (!order.delivery || !order.delivery.trackingNumber) {
      return res.status(404).json({
        success: false,
        message: 'Для цього замовлення не налаштована доставка Nova Poshta'
      });
    }

    const result = await NovaPoshtaService.getShipmentStatus(order.delivery.trackingNumber);

    res.json({
      success: result.success,
      orderNumber: order.orderNumber,
      trackingNumber: order.delivery.trackingNumber,
      status: result.status,
      statusDescription: result.statusDescription,
      lastEventCity: result.lastEventCity,
      lastEventDescription: result.lastEventDescription,
      message: result.message
    });
  } catch (error) {
    console.error('Помилка отримання статусу замовлення:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
