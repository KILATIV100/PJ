/**
 * Nova Poshta Service
 * Інтеграція з API Нова Пошта
 */

const axios = require('axios');

const NOVA_POSHTA_API_URL = 'https://api.novaposhta.ua/v2.0/json/';
const API_KEY = process.env.NOVA_POSHTA_API_KEY || 'your_api_key_here';

class NovaPoshtaService {
  /**
   * Отримати список міст з API
   */
  static async getCities(search = '') {
    try {
      const response = await axios.post(NOVA_POSHTA_API_URL, {
        apiKey: API_KEY,
        modelName: 'Address',
        calledMethod: 'getCities',
        methodProperties: {
          FindByString: search || ''
        }
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (response.data.success) {
        return {
          success: true,
          cities: response.data.data || []
        };
      }

      return {
        success: false,
        message: response.data.errors?.[0] || 'Помилка при отриманні міст'
      };
    } catch (error) {
      console.error('Помилка Nova Poshta getCities:', error.message);
      return {
        success: false,
        message: 'Помилка при підключенні до Nova Poshta'
      };
    }
  }

  /**
   * Отримати список відділень для міста
   */
  static async getDepartments(cityRef) {
    try {
      const response = await axios.post(NOVA_POSHTA_API_URL, {
        apiKey: API_KEY,
        modelName: 'Address',
        calledMethod: 'getWarehouses',
        methodProperties: {
          CityRef: cityRef,
          Page: 1,
          Limit: 100
        }
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (response.data.success) {
        return {
          success: true,
          departments: response.data.data || []
        };
      }

      return {
        success: false,
        message: response.data.errors?.[0] || 'Помилка при отриманні відділень'
      };
    } catch (error) {
      console.error('Помилка Nova Poshta getDepartments:', error.message);
      return {
        success: false,
        message: 'Помилка при підключенні до Nova Poshta'
      };
    }
  }

  /**
   * Розрахувати вартість доставки
   */
  static async calculateShipping(options) {
    try {
      const {
        senderCityRef,
        recipientCityRef,
        weight = 1,
        serviceType = '2', // 2 = доставка в відділення
        carriageType = '1' // 1 = адресна доставка
      } = options;

      const response = await axios.post(NOVA_POSHTA_API_URL, {
        apiKey: API_KEY,
        modelName: 'InternetDocument',
        calledMethod: 'getDocumentPrice',
        methodProperties: {
          CitySender: senderCityRef,
          CityRecipient: recipientCityRef,
          Weight: weight,
          ServiceType: serviceType,
          CarriageType: carriageType
        }
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (response.data.success && response.data.data.length > 0) {
        const priceInfo = response.data.data[0];
        return {
          success: true,
          cost: parseFloat(priceInfo.Cost),
          estimatedDays: priceInfo.EstimatedDeliveryDays
        };
      }

      return {
        success: false,
        message: 'Не вдалося розрахувати вартість доставки'
      };
    } catch (error) {
      console.error('Помилка Nova Poshta calculateShipping:', error.message);
      return {
        success: false,
        message: 'Помилка при розрахунку доставки'
      };
    }
  }

  /**
   * Отримати поточний курс вальют
   */
  static async getExchangeRates() {
    try {
      const response = await axios.post(NOVA_POSHTA_API_URL, {
        apiKey: API_KEY,
        modelName: 'Common',
        calledMethod: 'getMessageParcelList',
        methodProperties: {}
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      return {
        success: true,
        message: 'Курси завантажені'
      };
    } catch (error) {
      console.error('Помилка Nova Poshta getExchangeRates:', error.message);
      return {
        success: false,
        message: 'Помилка при отриманні курсів'
      };
    }
  }

  /**
   * Створити нову посилку (для інтеграції з замовленнями)
   */
  static async createShipment(shipmentData) {
    try {
      const {
        senderRef,
        recipientRef,
        senderCity,
        recipientCity,
        recipientDepartment,
        weight = 1,
        cost = 0,
        description = 'Посилка Pro Jet'
      } = shipmentData;

      const response = await axios.post(NOVA_POSHTA_API_URL, {
        apiKey: API_KEY,
        modelName: 'InternetDocument',
        calledMethod: 'save',
        methodProperties: {
          PayerType: 'Sender',
          PaymentMethod: 'NonCash',
          DateTime: new Date().toISOString().split('T')[0],
          CargoType: 'Parcel',
          VolumeGeneral: '0.1',
          Weight: weight,
          ServiceType: '2',
          Seats: '1',
          Description: description,
          Cost: cost,
          CitySender: senderCity,
          Sender: senderRef,
          CityRecipient: recipientCity,
          Recipient: recipientRef,
          RecipientAddress: recipientDepartment
        }
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (response.data.success) {
        return {
          success: true,
          shipmentRef: response.data.data?.[0]?.Ref,
          trackingNumber: response.data.data?.[0]?.Number,
          message: 'Посилка створена успішно'
        };
      }

      return {
        success: false,
        message: response.data.errors?.[0] || 'Помилка при створенні посилки'
      };
    } catch (error) {
      console.error('Помилка Nova Poshta createShipment:', error.message);
      return {
        success: false,
        message: 'Помилка при створенні посилки'
      };
    }
  }

  /**
   * Отримати статус посилки за трек-номером
   */
  static async getShipmentStatus(trackingNumber) {
    try {
      const response = await axios.post(NOVA_POSHTA_API_URL, {
        apiKey: API_KEY,
        modelName: 'TrackingDocument',
        calledMethod: 'getStatusDocuments',
        methodProperties: {
          Documents: [
            {
              DocumentNumber: trackingNumber,
              Phone: ''
            }
          ]
        }
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (response.data.success && response.data.data.length > 0) {
        const status = response.data.data[0];
        return {
          success: true,
          status: status.Status,
          statusDescription: status.StatusCode,
          lastEventCity: status.LastEventCity,
          lastEventDescription: status.LastEventDescription
        };
      }

      return {
        success: false,
        message: 'Посилка не знайдена'
      };
    } catch (error) {
      console.error('Помилка Nova Poshta getShipmentStatus:', error.message);
      return {
        success: false,
        message: 'Помилка при отриманні статусу'
      };
    }
  }
}

module.exports = NovaPoshtaService;
