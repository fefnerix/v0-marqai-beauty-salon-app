import { addMinutes, format, parseISO, isWithinInterval } from "date-fns"
import { ptBR } from "date-fns/locale"

export interface TimeSlot {
  start: string
  end: string
  available: boolean
  professionalId: string
}

export interface Service {
  id: string
  name: string
  duration_minutes: number
  buffer_after_minutes: number
}

export function calculateServicesDuration(services: Service[]): number {
  return services.reduce((total, service) => total + service.duration_minutes + service.buffer_after_minutes, 0)
}

export function generateTimeSlots(date: string, startHour = 8, endHour = 18, intervalMinutes = 30): string[] {
  const slots: string[] = []
  const baseDate = parseISO(`${date}T00:00:00`)

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const slotTime = addMinutes(baseDate, hour * 60 + minute)
      slots.push(slotTime.toISOString())
    }
  }

  return slots
}

export function hasTimeConflict(
  newStart: string,
  newEnd: string,
  existingAppointments: Array<{ start_at: string | null; end_at: string | null }>,
): boolean {
  const newStartTime = parseISO(newStart)
  const newEndTime = parseISO(newEnd)

  return existingAppointments.some((apt) => {
    if (!apt.start_at || !apt.end_at) return false

    const existingStart = parseISO(apt.start_at)
    const existingEnd = parseISO(apt.end_at)

    return (
      isWithinInterval(newStartTime, { start: existingStart, end: existingEnd }) ||
      isWithinInterval(newEndTime, { start: existingStart, end: existingEnd }) ||
      isWithinInterval(existingStart, { start: newStartTime, end: newEndTime })
    )
  })
}

export function formatTime(dateTime: string): string {
  return format(parseISO(dateTime), "HH:mm", { locale: ptBR })
}

export function formatDate(date: string): string {
  return format(parseISO(date), "dd/MM/yyyy", { locale: ptBR })
}

export function generateWhatsAppMessage(
  clientName: string,
  serviceName: string,
  dateTime: string,
  professionalName: string,
): string {
  const formattedDate = formatDate(dateTime)
  const formattedTime = formatTime(dateTime)

  return encodeURIComponent(
    `Olá ${clientName}! 👋\n\n` +
      `Confirmando seu agendamento:\n` +
      `📅 Data: ${formattedDate}\n` +
      `⏰ Horário: ${formattedTime}\n` +
      `💇 Serviço: ${serviceName}\n` +
      `👨‍💼 Profissional: ${professionalName}\n\n` +
      `Nos vemos em breve! 😊`,
  )
}

export function suggestNextVisit(lastVisitDate: string, intervalDays = 30): string {
  const lastVisit = parseISO(lastVisitDate)
  const nextVisit = addMinutes(lastVisit, intervalDays * 24 * 60)
  return nextVisit.toISOString()
}

export function isLateCancellation(appointmentStart: string, cancelTime: string, limitMinutes: number): boolean {
  const startTime = parseISO(appointmentStart)
  const cancelDateTime = parseISO(cancelTime)
  const timeDiff = (startTime.getTime() - cancelDateTime.getTime()) / (1000 * 60)

  return timeDiff < limitMinutes
}
