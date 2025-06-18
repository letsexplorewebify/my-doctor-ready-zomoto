"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Trash2, Calendar, List, Search, Filter, MoreVertical, Check, DollarSign } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { mockApi } from "@/lib/api"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Appointment = {
  id: string
  doctorId: string
  patientName: string
  date: Date
  time: string
  phoneNumber: string
  reason: string
  status: "confirmed" | "pending" | "cancelled" | "completed"
  paymentStatus?: "paid" | "unpaid"
  paymentAmount?: number
  paymentMethod?: "cash" | "upi" | "card"
  paymentDate?: Date
}

export default function ViewAppointments() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [activeTab, setActiveTab] = useState("list")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [doctorFilter, setDoctorFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card">("cash")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch doctors and appointments in parallel
        const [doctorsResponse, appointmentsResponse] = await Promise.all([
          mockApi.getDoctors(),
          mockApi.getAppointments(),
        ])

        setDoctors(doctorsResponse.data)

        // Convert date strings to Date objects if needed
        const formattedAppointments = appointmentsResponse.data.map((appointment: any) => ({
          ...appointment,
          date: appointment.date instanceof Date ? appointment.date : new Date(appointment.date),
        }))

        setAppointments(formattedAppointments)
        setFilteredAppointments(formattedAppointments)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load appointments. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    // Apply filters and search
    let result = [...appointments]

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (app) =>
          app.patientName.toLowerCase().includes(query) ||
          getDoctorName(app.doctorId).toLowerCase().includes(query) ||
          app.phoneNumber.includes(query) ||
          app.reason.toLowerCase().includes(query),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((app) => app.status === statusFilter)
    }

    // Apply doctor filter
    if (doctorFilter !== "all") {
      result = result.filter((app) => app.doctorId === doctorFilter)
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)

      const nextMonth = new Date(today)
      nextMonth.setMonth(nextMonth.getMonth() + 1)

      switch (dateFilter) {
        case "today":
          result = result.filter(
            (app) =>
              app.date.getDate() === today.getDate() &&
              app.date.getMonth() === today.getMonth() &&
              app.date.getFullYear() === today.getFullYear(),
          )
          break
        case "tomorrow":
          result = result.filter(
            (app) =>
              app.date.getDate() === tomorrow.getDate() &&
              app.date.getMonth() === tomorrow.getMonth() &&
              app.date.getFullYear() === tomorrow.getFullYear(),
          )
          break
        case "week":
          result = result.filter((app) => app.date >= today && app.date <= nextWeek)
          break
        case "month":
          result = result.filter((app) => app.date >= today && app.date <= nextMonth)
          break
      }
    }

    setFilteredAppointments(result)
  }, [searchQuery, statusFilter, doctorFilter, dateFilter, appointments])

  const handleDelete = async (id: string) => {
    try {
      await mockApi.deleteAppointment(id)

      // Update local state
      setAppointments(appointments.filter((app) => app.id !== id))

      toast({
        title: "Appointment Deleted",
        description: "The appointment has been successfully deleted.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the appointment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (
    appointment: Appointment,
    newStatus: "confirmed" | "pending" | "cancelled" | "completed",
  ) => {
    try {
      const updatedAppointment = { ...appointment, status: newStatus }

      // If status is completed, prompt for payment
      if (newStatus === "completed" && (!appointment.paymentStatus || appointment.paymentStatus === "unpaid")) {
        setSelectedAppointment(updatedAppointment)
        setShowPaymentDialog(true)
        return
      }

      await mockApi.updateAppointment(updatedAppointment)

      // Update local state
      setAppointments(appointments.map((app) => (app.id === appointment.id ? updatedAppointment : app)))

      toast({
        title: "Status Updated",
        description: `Appointment status has been updated to ${newStatus}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update the appointment status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handlePaymentSubmit = async () => {
    if (!selectedAppointment) return

    setIsProcessingPayment(true)

    try {
      const amount = Number.parseFloat(paymentAmount)

      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid payment amount.",
          variant: "destructive",
        })
        return
      }

      const updatedAppointment = {
        ...selectedAppointment,
        status: "completed",
        paymentStatus: "paid" as const,
        paymentAmount: amount,
        paymentMethod,
        paymentDate: new Date(),
      }

      await mockApi.updateAppointment(updatedAppointment)

      // Update local state
      setAppointments(appointments.map((app) => (app.id === selectedAppointment.id ? updatedAppointment : app)))

      toast({
        title: "Payment Recorded",
        description: `Payment of ${amount} has been recorded successfully.`,
      })

      setShowPaymentDialog(false)
      setPaymentAmount("")
      setPaymentMethod("cash")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500">Confirmed</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      case "cancelled":
        return <Badge className="bg-red-500">Cancelled</Badge>
      case "completed":
        return <Badge className="bg-blue-500">Completed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "#22c55e"
      case "pending":
        return "#eab308"
      case "cancelled":
        return "#ef4444"
      case "completed":
        return "#3b82f6"
      default:
        return "#6b7280"
    }
  }

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find((d) => d.id === doctorId)
    return doctor ? doctor.name : "Unknown Doctor"
  }

  const calendarEvents = filteredAppointments.map((appointment) => {
    // Parse the time string
    let hour = 0
    let minute = 0

    if (appointment.time) {
      const timeParts = appointment.time.match(/(\d+):(\d+)\s*(AM|PM)/i)
      if (timeParts) {
        hour = Number.parseInt(timeParts[1])
        minute = Number.parseInt(timeParts[2])
        const period = timeParts[3].toUpperCase()

        if (period === "PM" && hour !== 12) {
          hour += 12
        } else if (period === "AM" && hour === 12) {
          hour = 0
        }
      }
    }

    const dateObj = new Date(appointment.date)
    dateObj.setHours(hour)
    dateObj.setMinutes(minute)

    return {
      id: appointment.id,
      title: `${appointment.patientName} - ${getDoctorName(appointment.doctorId)}`,
      start: dateObj,
      end: new Date(dateObj.getTime() + 30 * 60000), // 30 minutes appointment
      backgroundColor: getStatusColor(appointment.status),
      borderColor: getStatusColor(appointment.status),
      extendedProps: {
        appointment: appointment,
      },
    }
  })

  const handleEventClick = (info: any) => {
    const appointmentId = info.event.id
    router.push(`/view-appointments/${appointmentId}`)
  }

  const handleViewDetails = (appointmentId: string) => {
    router.push(`/view-appointments/${appointmentId}`)
  }

  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setDoctorFilter("all")
    setDateFilter("all")
  }

  // Format date function to replace date-fns
  const formatDate = (date: Date, format: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    return date.toLocaleDateString(undefined, options)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading appointments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-zomato-red">View Appointments</h1>
        <p className="text-muted-foreground mt-2">Manage and view all your scheduled appointments</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>All Appointments</CardTitle>
                <CardDescription>A list of all appointments in the system</CardDescription>
              </div>
              <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="list" className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">List</span>
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">Calendar</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>

          <div className="px-6 pb-2">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search appointments..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Doctors</SelectItem>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="tomorrow">Tomorrow</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="icon" onClick={resetFilters} title="Reset Filters">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <CardContent>
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No appointments found.</p>
                <Button variant="link" onClick={resetFilters} className="mt-2">
                  Reset filters
                </Button>
              </div>
            ) : (
              <div>
                {activeTab === "list" ? (
                  <div className="overflow-x-auto animate-fade-in">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAppointments.map((appointment) => (
                          <TableRow key={appointment.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{appointment.patientName}</TableCell>
                            <TableCell>{getDoctorName(appointment.doctorId)}</TableCell>
                            <TableCell>{formatDate(appointment.date, "PPP")}</TableCell>
                            <TableCell>{appointment.time}</TableCell>
                            <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="rounded-full"
                                  onClick={() => handleViewDetails(appointment.id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="rounded-full">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />

                                    {appointment.status !== "completed" && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(appointment, "completed")}>
                                        <Check className="mr-2 h-4 w-4" />
                                        <span>Mark as Completed</span>
                                      </DropdownMenuItem>
                                    )}

                                    {appointment.status !== "confirmed" && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(appointment, "confirmed")}>
                                        <span>Mark as Confirmed</span>
                                      </DropdownMenuItem>
                                    )}

                                    {appointment.status !== "pending" && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(appointment, "pending")}>
                                        <span>Mark as Pending</span>
                                      </DropdownMenuItem>
                                    )}

                                    {appointment.status !== "cancelled" && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(appointment, "cancelled")}>
                                        <span>Mark as Cancelled</span>
                                      </DropdownMenuItem>
                                    )}

                                    {appointment.status === "completed" && !appointment.paymentStatus && (
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedAppointment(appointment)
                                          setShowPaymentDialog(true)
                                        }}
                                      >
                                        <DollarSign className="mr-2 h-4 w-4" />
                                        <span>Collect Payment</span>
                                      </DropdownMenuItem>
                                    )}

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => handleDelete(appointment.id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      <span>Delete</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="h-[600px] animate-fade-in">
                    <FullCalendar
                      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                      initialView="dayGridMonth"
                      headerToolbar={{
                        left: "prev,next today",
                        center: "title",
                        right: "dayGridMonth,timeGridWeek,timeGridDay",
                      }}
                      events={calendarEvents}
                      eventClick={handleEventClick}
                      height="100%"
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Collection Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Collect Payment</DialogTitle>
            <DialogDescription>Record payment for the completed appointment.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="amount" className="text-right">
                Amount
              </label>
              <div className="col-span-3 relative">
                <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="amount"
                  placeholder="Enter amount"
                  className="pl-8"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="payment-method" className="text-right">
                Method
              </label>
              <Select value={paymentMethod} onValueChange={(value: "cash" | "upi" | "card") => setPaymentMethod(value)}>
                <SelectTrigger className="col-span-3" id="payment-method">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePaymentSubmit} disabled={isProcessingPayment}>
              {isProcessingPayment ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                "Record Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
