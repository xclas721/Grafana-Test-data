export type CountryInfo = { alpha2: string; alpha3: string; name: string }

export type CurrencyInfo = { alphabetic: string; name: string; minorUnit: string }

/** 商戶國別隨機池（全球） */
export const MERCHANT_COUNTRY_CODE_STR_VALUES = [
  '156',
  '840',
  '076',
  '392',
  '344',
  '410',
  '702',
  '036',
  '124',
  '978',
  '826',
  '116'
] as const

/** 商戶國別隨機池（亞洲優先，含測試用巴西） */
export const MERCHANT_COUNTRY_CODE_ASIA_VALUES = [
  '156', // China
  '392', // Japan
  '344', // Hong Kong
  '410', // South Korea
  '702', // Singapore
  '116', // Cambodia
  '764', // Thailand
  '704', // Vietnam
  '458', // Malaysia
  '360', // Indonesia
  '608', // Philippines
  '076' // Brazil (treated as Asia for testing/random)
] as const

export const COUNTRY_NUMERIC_MAP: Record<string, CountryInfo> = {
  '156': { alpha2: 'CN', alpha3: 'CHN', name: 'China' },
  '158': { alpha2: 'TW', alpha3: 'TWN', name: 'Taiwan' },
  '840': { alpha2: 'US', alpha3: 'USA', name: 'United States' },
  '076': { alpha2: 'BR', alpha3: 'BRA', name: 'Brazil' },
  '392': { alpha2: 'JP', alpha3: 'JPN', name: 'Japan' },
  '344': { alpha2: 'HK', alpha3: 'HKG', name: 'Hong Kong' },
  '410': { alpha2: 'KR', alpha3: 'KOR', name: 'South Korea' },
  '702': { alpha2: 'SG', alpha3: 'SGP', name: 'Singapore' },
  '116': { alpha2: 'KH', alpha3: 'KHM', name: 'Cambodia' },
  '036': { alpha2: 'AU', alpha3: 'AUS', name: 'Australia' },
  '124': { alpha2: 'CA', alpha3: 'CAN', name: 'Canada' },
  '978': { alpha2: 'EU', alpha3: 'EUR', name: 'European Union' },
  '826': { alpha2: 'GB', alpha3: 'GBR', name: 'United Kingdom' },
  // 與 MERCHANT_COUNTRY_CODE_ASIA_VALUES 及 country-codes 參考表一致，避免隨機選到時代碼與名稱不符
  '764': { alpha2: 'TH', alpha3: 'THA', name: 'Thailand' },
  '704': { alpha2: 'VN', alpha3: 'VNM', name: 'Viet Nam' },
  '458': { alpha2: 'MY', alpha3: 'MYS', name: 'Malaysia' },
  '360': { alpha2: 'ID', alpha3: 'IDN', name: 'Indonesia' },
  '608': { alpha2: 'PH', alpha3: 'PHL', name: 'Philippines' }
}

export const CURRENCY_NUMERIC_MAP: Record<string, CurrencyInfo> = {
  '156': { alphabetic: 'CNY', name: 'Yuan Renminbi', minorUnit: '2' },
  '901': { alphabetic: 'TWD', name: 'New Taiwan Dollar', minorUnit: '2' },
  '840': { alphabetic: 'USD', name: 'US Dollar', minorUnit: '2' },
  '392': { alphabetic: 'JPY', name: 'Yen', minorUnit: '0' },
  '344': { alphabetic: 'HKD', name: 'Hong Kong Dollar', minorUnit: '2' },
  '410': { alphabetic: 'KRW', name: 'Won', minorUnit: '0' },
  '702': { alphabetic: 'SGD', name: 'Singapore Dollar', minorUnit: '2' },
  '036': { alphabetic: 'AUD', name: 'Australian Dollar', minorUnit: '2' },
  '124': { alphabetic: 'CAD', name: 'Canadian Dollar', minorUnit: '2' },
  '978': { alphabetic: 'EUR', name: 'Euro', minorUnit: '2' },
  '826': { alphabetic: 'GBP', name: 'Pound Sterling', minorUnit: '2' },
  '116': { alphabetic: 'KHR', name: 'Riel', minorUnit: '2' },
  '764': { alphabetic: 'THB', name: 'Baht', minorUnit: '2' },
  '704': { alphabetic: 'VND', name: 'Dong', minorUnit: '0' },
  '458': { alphabetic: 'MYR', name: 'Malaysian Ringgit', minorUnit: '2' },
  '360': { alphabetic: 'IDR', name: 'Rupiah', minorUnit: '0' },
  '608': { alphabetic: 'PHP', name: 'Philippine Peso', minorUnit: '2' }
}

/** GeoIP 生成用：國家數字碼 → 顯示名稱與 Alpha-2 */
export const GEOIP_COUNTRY_CODE_MAP: Record<string, { name: string; alpha2: string }> = {
  '156': { name: 'China', alpha2: 'CN' },
  '158': { name: 'Taiwan', alpha2: 'TW' },
  '840': { name: 'United States', alpha2: 'US' },
  '392': { name: 'Japan', alpha2: 'JP' },
  '344': { name: 'Hong Kong', alpha2: 'HK' },
  '410': { name: 'South Korea', alpha2: 'KR' },
  '702': { name: 'Singapore', alpha2: 'SG' },
  '116': { name: 'Cambodia', alpha2: 'KH' },
  '036': { name: 'Australia', alpha2: 'AU' },
  '124': { name: 'Canada', alpha2: 'CA' },
  '978': { name: 'Eurozone', alpha2: 'EU' },
  '826': { name: 'United Kingdom', alpha2: 'GB' }
}
