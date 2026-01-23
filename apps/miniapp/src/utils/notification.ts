import Taro from '@tarojs/taro';

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
  // 这里需要替换为实际的模板 ID
  const templateId = 'your-event-reminder-template-id';
  return requestSubscribeMessage([templateId]);
}

/**
 * 请求家庭邀请通知权限
 */
export async function requestFamilyInvitePermission(): Promise<boolean> {
  const templateId = 'your-family-invite-template-id';
  return requestSubscribeMessage([templateId]);
}

/**
 * 请求月度回忆通知权限
 */
export async function requestMonthlyMemoryPermission(): Promise<boolean> {
  const templateId = 'your-monthly-memory-template-id';
  return requestSubscribeMessage([templateId]);
}

/**
 * 一次性请求所有通知权限
 */
export async function requestAllNotificationPermissions(): Promise<boolean> {
  const templateIds = [
    'your-event-reminder-template-id',
    'your-family-invite-template-id',
    'your-monthly-memory-template-id',
  ];

  return requestSubscribeMessage(templateIds);
}
