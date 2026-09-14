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

  it('deviceChannel 隨機池包含 01（App-based）', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 200; i++) {
      const roll = i / 200
      const updates = randomizeThreeDSDeviceFields(
        {
          enableMessageCategory: false,
          enableDeviceChannel: true,
          enableThreeDSRequestorChallengeInd: false,
          enableDeviceIpAddressRandom: false,
          enableDevicePlatformRandom: false,
          enableDeviceLocaleRandom: false,
          enableDeviceAdvertisingIdRandom: false,
          enableThreeDSCompIndRandom: false,
          enableAuthenticationMethodRandom: false,
          enableAuthenticationTypeRandom: false
        },
        () => roll
      )
      seen.add(updates.deviceChannel!)
    }
    expect(seen).toEqual(new Set(['01', '02', '03']))
  })

  it('deviceChannel 隨機為 01/03 時，threeDSCompInd 不應帶 Y/N（依 spec 僅 Browser-based 必填）', () => {
    const updates = randomizeThreeDSDeviceFields(
      {
        enableMessageCategory: false,
        enableDeviceChannel: true,
        enableThreeDSRequestorChallengeInd: false,
        enableDeviceIpAddressRandom: false,
        enableDevicePlatformRandom: false,
        enableDeviceLocaleRandom: false,
        enableDeviceAdvertisingIdRandom: false,
        enableThreeDSCompIndRandom: true,
        enableAuthenticationMethodRandom: false,
        enableAuthenticationTypeRandom: false
      },
      () => 0
    )
    expect(updates.deviceChannel).toBe('01')
    expect(updates.threeDSCompInd).toBe('')
  })

  it('deviceChannel 隨機為 02 時，threeDSCompInd 仍會帶 Y/N', () => {
    const updates = randomizeThreeDSDeviceFields(
      {
        enableMessageCategory: false,
        enableDeviceChannel: true,
        enableThreeDSRequestorChallengeInd: false,
        enableDeviceIpAddressRandom: false,
        enableDevicePlatformRandom: false,
        enableDeviceLocaleRandom: false,
        enableDeviceAdvertisingIdRandom: false,
        enableThreeDSCompIndRandom: true,
        enableAuthenticationMethodRandom: false,
        enableAuthenticationTypeRandom: false
      },
      () => 0.5
    )
    expect(updates.deviceChannel).toBe('02')
    expect(['Y', 'N']).toContain(updates.threeDSCompInd)
  })
})
