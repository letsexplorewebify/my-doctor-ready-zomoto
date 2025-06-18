"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon, Clock, User, Phone, FileText, Check, AlertTriangle } from "lucide-react"
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from "date-fns"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockApi } from "@/lib/api"
import { OtpInput } from "@/components/otp-input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Form schema
const formSchema = z.object({
  doctorId: z.string({
    required_error: "Please select a doctor.",
  }),
  patientName: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  date: z.date({
    required_error: "Please select a date.",
  }),
  time: z.string({
    required_error: "Please select a time.",
  }),
  phoneNumber: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
  reason: z.string().min(5, {
    message: "Reason must be at least 5 characters.",
  }),
})

// Generate time slots
const generateTimeSlots = () => {
  const slots = []
  const startHour = 9
  const endHour = 17

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === endHour && minute > 0) continue

      const formattedHour = hour % 12 === 0 ? 12 : hour % 12
      const period = hour >= 12 ? "PM" : "AM"
      const formattedMinute = minute === 0 ? "00" : minute

      slots.push(`${formattedHour}:${formattedMinute} ${period}`)
    }
  }

  return slots
}

export default function BookAppointment() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null)
  const [unavailableSlots, setUnavailableSlots] = useState<Set<string>>(new Set())
  const [doctors, setDoctors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showOtpDialog, setShowOtpDialog] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [doctorUnavailableDates, setDoctorUnavailableDates] = useState<Date[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      doctorId: "",
      patientName: "",
      phoneNumber: "",
      reason: "",
      time: "",
    },
  })

  const selectedDate = form.watch("date")
  const selectedTime = form.watch("time")
  const phoneNumber = form.watch("phoneNumber")

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true)
        const response = await mockApi.getDoctors()
        setDoctors(response.data)
      } catch (error) {
        console.error("Error fetching doctors:", error)
        toast({
          title: "Error",
          description: "Failed to load doctors. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDoctors()
  }, [])

  useEffect(() => {
    if (selectedDate && selectedDoctor) {
      // Get available time slots for the selected doctor and date
      const doctor = doctors.find((d) => d.id === selectedDoctor)
      if (doctor) {
        // Check if the selected date is in the doctor's unavailable dates
        const isDateUnavailable =
          doctor.unavailableDates &&
          doctor.unavailableDates.some((dateStr: string) => {
            const unavailableDate = new Date(dateStr)
            return isSameDay(unavailableDate, selectedDate)
          })

        if (isDateUnavailable) {
          // If the date is unavailable, show a message and clear time slots
          toast({
            title: "Doctor Unavailable",
            description: `${doctor.name} is not available on ${format(selectedDate, "MMMM d, yyyy")}. Please select another date.`,
            variant: "destructive",
          })
          setAvailableTimeSlots([])
          return
        }

        // If the date is available, get the available times
        if (doctor.availableTimes) {
          const dayOfWeek = selectedDate.getDay()
          const dayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][dayOfWeek]

          // Get the available times for the selected day
          const timesForDay = doctor.availableTimes[dayName] || []
          setAvailableTimeSlots(timesForDay)
        } else {
          // If no specific times are set, use default time slots
          setAvailableTimeSlots(generateTimeSlots())
        }

        // Also set unavailable slots based on existing appointments
        setUnavailableSlots(getUnavailableSlots(selectedDate))
      }
    }
  }, [selectedDate, selectedDoctor, doctors])

  // Update unavailable dates when doctor changes
  useEffect(() => {
    if (selectedDoctor) {
      const doctor = doctors.find((d) => d.id === selectedDoctor)
      if (doctor && doctor.unavailableDates) {
        // Convert string dates to Date objects
        const unavailableDates = doctor.unavailableDates.map((dateStr: string) => new Date(dateStr))
        setDoctorUnavailableDates(unavailableDates)
      } else {
        setDoctorUnavailableDates([])
      }
    }
  }, [selectedDoctor, doctors])

  // Generate unavailable slots randomly
  const getUnavailableSlots = (date: Date) => {
    // Seed based on the date to get consistent results for the same date
    const seed = date.getDate() + date.getMonth() * 31
    const unavailableSlots = new Set<string>()

    // Make some slots unavailable
    availableTimeSlots.forEach((slot) => {
      // Use the seed to determine if a slot is unavailable
      if ((seed * availableTimeSlots.indexOf(slot)) % 7 === 0) {
        unavailableSlots.add(slot)
      }
    })

    return unavailableSlots
  }

  const getDaysOfWeek = () => {
    const days = []
    for (let i = 0; i < 7; i++) {
      days.push(addDays(currentWeekStart, i))
    }
    return days
  }

  const handlePreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1))
  }

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1))
  }

  const handleDateSelect = (date: Date) => {
    // Check if the date is in the doctor's unavailable dates
    if (selectedDoctor) {
      const doctor = doctors.find((d) => d.id === selectedDoctor)
      if (doctor && doctor.unavailableDates) {
        const isUnavailable = doctor.unavailableDates.some((dateStr: string) => {
          const unavailableDate = new Date(dateStr)
          return isSameDay(unavailableDate, date)
        })

        if (isUnavailable) {
          toast({
            title: "Doctor Unavailable",
            description: `${doctor.name} is not available on ${format(date, "MMMM d, yyyy")}. Please select another date.`,
            variant: "destructive",
          })
          return
        }
      }
    }

    form.setValue("date", date)
    // Clear the time selection when date changes
    form.setValue("time", "")
  }

  const handleTimeSelect = (time: string) => {
    form.setValue("time", time)
  }

  const handleDoctorSelect = (doctorId: string) => {
    setSelectedDoctor(doctorId)
    form.setValue("doctorId", doctorId)
    // Clear date and time when doctor changes
    form.setValue("time", "")
  }

  const handleVerifyPhone = () => {
    if (phoneNumber && phoneNumber.length >= 10) {
      // In a real app, you would send an OTP to the phone number
      setShowOtpDialog(true)
    } else {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number.",
        variant: "destructive",
      })
    }
  }

  const handleOtpComplete = (otp: string) => {
    // In a real app, you would verify the OTP with your backend
    console.log("OTP entered:", otp)

    // For demo purposes, we'll accept any 4-digit OTP
    if (otp.length === 4) {
      setPhoneVerified(true)
      setShowOtpDialog(false)
      toast({
        title: "Phone Verified",
        description: "Your phone number has been verified successfully.",
      })
    } else {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid OTP.",
        variant: "destructive",
      })
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!phoneVerified) {
      toast({
        title: "Phone Not Verified",
        description: "Please verify your phone number before booking.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await mockApi.addAppointment(values)

      toast({
        title: "Appointment Booked",
        description: `Your appointment with ${doctors.find((d) => d.id === values.doctorId)?.name} on ${format(values.date, "PPP")} at ${values.time} has been booked.`,
      })

      form.reset()
      setPhoneVerified(false)
      router.push("/view-appointments")
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error booking your appointment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading doctors...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-zomato-red">Book an Appointment</h1>
        <p className="text-muted-foreground mt-2">Schedule your visit with our top specialists</p>
      </motion.div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-zomato-red" />
                  Select Doctor
                </CardTitle>
                <CardDescription>Choose a specialist for your appointment</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="doctorId"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {doctors.map((doctor) => (
                          <motion.div key={doctor.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                            <div
                              className={cn(
                                "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                                selectedDoctor === doctor.id
                                  ? "border-primary bg-primary/5 shadow-sm"
                                  : "hover:border-primary/50 hover:bg-muted/50",
                              )}
                              onClick={() => handleDoctorSelect(doctor.id)}
                            >
                              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden">
                                {doctor.imageUrl ? (
                                  <img
                                    src={doctor.imageUrl || "/placeholder.svg"}
                                    alt={doctor.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  doctor.avatar
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{doctor.name}</div>
                                <div className="text-sm text-muted-foreground">{doctor.specialization}</div>
                                {doctor.unavailableDates && doctor.unavailableDates.length > 0 && (
                                  <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                                    <AlertTriangle className="h-3 w-3" />
                                    <span>{doctor.unavailableDates.length} unavailable day(s)</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-zomato-red" />
                  Select Date & Time
                </CardTitle>
                <CardDescription>Choose when you'd like to visit</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <Button type="button" variant="outline" onClick={handlePreviousWeek} className="rounded-full">
                          Previous
                        </Button>
                        <div className="font-medium">
                          {format(currentWeekStart, "MMMM d")} - {format(addDays(currentWeekStart, 6), "MMMM d, yyyy")}
                        </div>
                        <Button type="button" variant="outline" onClick={handleNextWeek} className="rounded-full">
                          Next
                        </Button>
                      </div>

                      <div className="grid grid-cols-7 gap-2 mb-6">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                          <div key={day} className="text-center text-sm font-medium">
                            {day}
                          </div>
                        ))}

                        {getDaysOfWeek().map((date) => {
                          const isSelected = selectedDate && isSameDay(date, selectedDate)
                          const isToday = isSameDay(date, new Date())

                          // Check if the date is in the doctor's unavailable dates
                          const isUnavailable = doctorUnavailableDates.some((unavailableDate) =>
                            isSameDay(unavailableDate, date),
                          )

                          return (
                            <motion.div
                              key={date.toString()}
                              whileHover={{ scale: isUnavailable ? 1 : 1.05 }}
                              whileTap={{ scale: isUnavailable ? 1 : 0.95 }}
                            >
                              <div
                                className={cn(
                                  "calendar-day",
                                  isSelected ? "selected" : "",
                                  isToday ? "today" : "",
                                  isUnavailable ? "bg-red-100 text-red-500 cursor-not-allowed" : "",
                                  date.getDay() === 0 || date.getDay() === 6
                                    ? "text-muted-foreground"
                                    : "current-month",
                                )}
                                onClick={() => !isUnavailable && handleDateSelect(date)}
                              >
                                <div>{format(date, "d")}</div>
                                {isUnavailable && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-full h-0.5 bg-red-500 rotate-45 transform origin-center"></div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>

                      <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-zomato-red" />
                              Available Time Slots
                            </FormLabel>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-2">
                              {availableTimeSlots.map((time) => {
                                const isUnavailable = unavailableSlots.has(time)
                                const isSelected = selectedTime === time

                                return (
                                  <motion.div
                                    key={time}
                                    whileHover={!isUnavailable ? { scale: 1.05 } : {}}
                                    whileTap={!isUnavailable ? { scale: 0.95 } : {}}
                                  >
                                    <div
                                      className={cn(
                                        "time-slot",
                                        isSelected ? "selected" : "",
                                        isUnavailable ? "unavailable" : "available",
                                      )}
                                      onClick={() => !isUnavailable && handleTimeSelect(time)}
                                    >
                                      {time}
                                    </div>
                                  </motion.div>
                                )
                              })}
                            </div>
                            {availableTimeSlots.length === 0 && selectedDoctor && selectedDate && (
                              <p className="text-sm text-muted-foreground mt-2">
                                No available time slots for this doctor on the selected date.
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-zomato-red" />
                  Your Information
                </CardTitle>
                <CardDescription>Tell us about yourself and your visit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="patientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4 text-zomato-red" />
                          Your Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} className="rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-zomato-red" />
                          Phone Number
                        </FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              placeholder="Enter your phone number"
                              {...field}
                              className="rounded-xl"
                              disabled={phoneVerified}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant={phoneVerified ? "outline" : "secondary"}
                            onClick={handleVerifyPhone}
                            disabled={phoneVerified}
                            className="rounded-xl"
                          >
                            {phoneVerified ? <Check className="h-4 w-4 mr-2 text-green-500" /> : null}
                            {phoneVerified ? "Verified" : "Verify"}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem className="mt-6">
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-zomato-red" />
                        Reason for Visit
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Briefly describe your symptoms or reason for the appointment"
                          className="resize-none rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex justify-center"
          >
            <Button
              type="submit"
              className="w-full md:w-auto px-8 py-6 rounded-xl bg-zomato-red hover:bg-zomato-darkRed text-white font-bold text-lg"
              disabled={isSubmitting || !phoneVerified}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Booking...</span>
                </div>
              ) : (
                "Book Appointment"
              )}
            </Button>
          </motion.div>
        </form>
      </Form>

      {/* OTP Verification Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Your Phone Number</DialogTitle>
            <DialogDescription>
              We've sent a 4-digit code to {phoneNumber}. Please enter it below to verify your phone number.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-6 py-4">
            <OtpInput onComplete={handleOtpComplete} />
            <p className="text-sm text-muted-foreground">For demo purposes, enter any 4 digits to verify.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
