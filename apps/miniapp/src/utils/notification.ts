import Taro from '@tarojs/taro';

// 微信订阅消息模板 ID
const TEMPLATE_IDS = {
  EVENT_REMINDER: 'brNpHCtsdA2PAG3VH_z6FEOkbEvOnYLnsqCx1stjI-k',
  FAMILY_INVITE: 'aHaWjfjUvjYJKou5tfGGjx7FiqTEJRBOWlaFEZ_zRHY',
  MONTHLY_MEMORY: '6K5gaJmMnrQe2uTN1gbDPpv08oUUc_nzptElHrbuyLc',
};

/**
 * 请求订阅消息权限
 * @param templateIds 模板 ID 数组
 * @returns 是否授权成功
 */
export async function requestSubscribeMessage(
  templateIds: string[]
): Promise<boolean> {
  try {
    const res = await Taro.requestSubscribeMessage({
      tmplIds: templateIds,
    });

    // 检查是否所有模板都授权成功
    const allAccepted = templateIds.every(
      (id) => res[id] === 'accept'
    );

    if (allAccepted) {
      console.log('All subscription messages accepted');
      return true;
    } else {
      console.warn('Some subscription messages rejected:', res);
      return false;
    }
  } catch (error: any) {
    console.error('Failed to request subscribe message:', error);

    // 用户拒绝授权或其他错误
    if (error.errMsg?.includes('reject')) {
      Taro.showToast({
        title: '您拒绝了消息推送',
        icon: 'none',
      });
    }

    return false;
  }
}

/**
 * 请求日程提醒权限
 */
export async function requestEventReminderPermission(): Promise<boolean> {
  return requestSubscribeMessage([TEMPLATE_IDS.EVENT_REMINDER]);
}

/**
 * 请求家庭邀请通知权限
 */
export async function requestFamilyInvitePermission(): Promise<boolean> {
  return requestSubscribeMessage([TEMPLATE_IDS.FAMILY_INVITE]);
}

/**
 * 请求月度回忆通知权限
 */
export async function requestMonthlyMemoryPermission(): Promise<boolean> {
  return requestSubscribeMessage([TEMPLATE_IDS.MONTHLY_MEMORY]);
}

/**
 * 一次性请求所有通知权限
 */
export async function requestAllNotificationPermissions(): Promise<boolean> {
  return requestSubscribeMessage([
    TEMPLATE_IDS.EVENT_REMINDER,
    TEMPLATE_IDS.FAMILY_INVITE,
    TEMPLATE_IDS.MONTHLY_MEMORY,
  ]);
}
