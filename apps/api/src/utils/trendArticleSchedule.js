export const parseDailyCronTime = (cronExpression) => {
	const fields = String(cronExpression || '').trim().split(/\s+/);
	if (fields.length !== 5) return null;

	const [minuteField, hourField, dayOfMonth, month, dayOfWeek] = fields;
	if (dayOfMonth !== '*' || month !== '*' || dayOfWeek !== '*') return null;
	if (!/^\d+$/.test(minuteField) || !/^\d+$/.test(hourField)) return null;

	const minute = Number(minuteField);
	const hour = Number(hourField);
	if (minute < 0 || minute > 59 || hour < 0 || hour > 23) return null;

	return { hour, minute };
};

const getZonedClockMinutes = (date, timeZone) => {
	const parts = new globalThis.Intl.DateTimeFormat('en-US', {
		timeZone,
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
	}).formatToParts(date);
	const values = Object.fromEntries(parts.map(part => [part.type, part.value]));

	return (Number(values.hour) * 60) + Number(values.minute);
};

export const shouldRunStartupCatchup = ({ cronExpression, timeZone, now = new Date() }) => {
	const scheduleTime = parseDailyCronTime(cronExpression);
	if (!scheduleTime) return false;

	const currentMinutes = getZonedClockMinutes(now, timeZone);
	const scheduledMinutes = (scheduleTime.hour * 60) + scheduleTime.minute;
	return currentMinutes >= scheduledMinutes;
};
