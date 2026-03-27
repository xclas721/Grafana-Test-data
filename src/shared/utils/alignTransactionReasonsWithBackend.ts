/**
 * 寫入 ES 前對齊兩套產品線（宜與 threeds-server-v3 / threeds-acs-v3 一併對照）：
 *
 * - **3DSS**（`3dss-transaction`）：`BaseThreedsTransService.updateErrorStatus`、`AReqMessageHandler`
 *   → S 端 AReq/ARes/RReq 錯誤常為 transStatus=U、transStatusReason=07、stateMachineReason=S34xx 等。
 * - **ACS**（`acs-transaction`）：`ThreedsTransServiceCore.updateErrorStatus`（7 參數預設 + 9 參數內 Mastercard 覆寫）
 *   → 多數 A 端錯誤為 N + transStatusReason=09 + challengeCancel=06；CReq/2.3.1/M、UL 等有分支。
 * - **ACS 索引上的 S 錯誤**：語意仍屬 3DSS，與 server 相同對齊 U/07 與 S 前綴 stm。
 */
export function alignTransactionReasonsForMetricsDocument(
  form: Record<string, string>,
  indexName: string
): void {
  const code = String(form.errorCode ?? '').trim()
  if (!code || code === 'NULL_VALUE') return

  const isDssIndex = indexName.includes('3dss')
  const isAcsIndex = indexName.includes('acs')

  if (isDssIndex) {
    alignDssTransactionReasons(form)
  } else if (isAcsIndex) {
    alignAcsTransactionReasons(form)
  }
}

/** threeds-server-v3：S 端錯誤 */
function alignDssTransactionReasons(form: Record<string, string>): void {
  const comp = String(form.errorComponent ?? '').trim()
  if (comp !== 'S') return

  const msgType = String(form.errorMessageType ?? '').trim()
  const detail = String(form.errorDetail ?? '').toLowerCase()
  const code = String(form.errorCode ?? '').trim()

  const applyNotPerformedInvalid = () => {
    form.transStatus = 'U'
    form.transStatusReason = '07'
  }

  if (msgType === 'AReq') {
    applyNotPerformedInvalid()
    form.rreqTransStatus = 'NULL_VALUE'
    if (code === '402') {
      form.stateMachineReason =
        detail.includes('connect') && !detail.includes('timed out') ? 'S3401' : 'S3402'
    } else if (code === '403') {
      form.stateMachineReason = 'S3403'
    } else {
      form.stateMachineReason = 'S9999'
    }
    return
  }

  if (msgType === 'ARes' || msgType === 'RReq') {
    applyNotPerformedInvalid()
    if (msgType === 'ARes') {
      form.stateMachineReason =
        code === '101' || code === '203' || code === '403' ? 'S3403' : 'S3499'
    } else {
      form.stateMachineReason = 'S3403'
    }
  }
}

/**
 * threeds-acs-v3：`ThreedsTransServiceCore.updateErrorStatus`
 * （7 參數方法之預設值 + 9 參數方法內 Mastercard 對 CReq/challengeCancel 之覆寫）
 */
function alignAcsTransactionReasons(form: Record<string, string>): void {
  const comp = String(form.errorComponent ?? '').trim()

  if (comp === 'S') {
    alignDssTransactionReasons(form)
    return
  }

  if (comp !== 'A') return

  const msgType = String(form.errorMessageType ?? '').trim()
  const scheme = String(form.cardScheme ?? '').trim()
  const mv = String(form.messageVersion ?? '2.2.0')
  const code = String(form.errorCode ?? '').trim()
  const detail = String(form.errorDetail ?? '')

  let transStatus = 'N'
  let transStatusReason = '09'
  let challengeCancel = '06'

  if (msgType === 'CReq' && mv >= '2.3.1') {
    challengeCancel = '10'
    if (scheme === 'M') {
      transStatus = 'U'
      transStatusReason = '22'
    }
  }

  if (scheme === 'U') {
    transStatus = 'U'
    if (
      msgType === 'CReq' &&
      code === '101' &&
      detail.includes('CReq') &&
      detail.includes('Invalid base64url')
    ) {
      transStatus = 'N'
      challengeCancel = '05'
    }
  }

  if (scheme === 'M') {
    if (msgType === 'CReq' || challengeCancel === '09' || challengeCancel === '10') {
      transStatus = 'U'
      transStatusReason = '22'
    }
  }

  form.transStatus = transStatus
  form.transStatusReason = transStatusReason
  form.challengeCancel = challengeCancel
}
