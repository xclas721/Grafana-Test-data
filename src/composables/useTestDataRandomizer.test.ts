import { describe, expect, it } from 'vitest'
import { randomizeThreeDSDeviceFields } from './useTestDataRandomizer'

describe('useTestDataRandomizer', () => {
  it('全部開關關閉時不應產生任何更新', () => {
    const updates = randomizeThreeDSDeviceFields({
      enableMessageCategory: false,
      enableDeviceChannel: false,
      enableThreeDSRequestorChallengeInd: false,
      enableDeviceIpAddressRandom: false,
      enableDevicePlatformRandom: false,
      enableDeviceLocaleRandom: false,
      enableDeviceAdvertisingIdRandom: false,
      enableThreeDSCompIndRandom: false,
      enableAuthenticationMethodRandom: false,
      enableAuthenticationTypeRandom: false
    })

    expect(updates).toEqual({})
  })

  it('會在裝置 IP 隨機時同步 browserIP', () => {
    const updates = randomizeThreeDSDeviceFields(
      {
        enableMessageCategory: false,
        enableDeviceChannel: false,
        enableThreeDSRequestorChallengeInd: false,
        enableDeviceIpAddressRandom: true,
        enableDevicePlatformRandom: false,
        enableDeviceLocaleRandom: false,
        enableDeviceAdvertisingIdRandom: false,
        enableThreeDSCompIndRandom: false,
        enableAuthenticationMethodRandom: false,
        enableAuthenticationTypeRandom: false
      },
      () => 0
    )

    expect(updates.deviceIpAddress).toBeDefined()
    expect(updates.browserIP).toBe(updates.deviceIpAddress)
  })
})

