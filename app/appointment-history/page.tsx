"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Filter, Calendar, BarChart3, TrendingUp, DollarSign, Download } from "lucide-react"
import { mockApi } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type CompletedAppointment = {
  id: string
  doctorId: string
  patientName: string
  date: Date
  time: string
  phoneNumber: string
  reason: string
  status: "completed"
  paymentStatus: "paid"
  paymentAmount: number
  paymentMethod: "cash" | "upi" | "card"
  paymentDate: Date
}

export default function AppointmentHistory() {
  const [appointments, setAppointments] = useState<CompletedAppointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<CompletedAppointment[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [doctorFilter, setDoctorFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all")

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

        // Filter only completed appointments with payment
        const completedAppointments = appointmentsResponse.data
          .filter((app: any) => app.status === "completed" && app.paymentStatus === "paid")
          .map((appointment: any) => ({
            ...appointment,
            date: appointment.date instanceof Date ? appointment.date : new Date(appointment.date),
            paymentDate:
              appointment.paymentDate instanceof Date ? appointment.paymentDate : new Date(appointment.paymentDate),
          }))

        setAppointments(completedAppointments)
        setFilteredAppointments(completedAppointments)

        // Calculate revenue metrics
        calculateRevenueMetrics(completedAppointments)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load appointment history. Please try again.",
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
          app.phoneNumber.includes(query),
      )
    }

    // Apply doctor filter
    if (doctorFilter !== "all") {
      result = result.filter((app) => app.doctorId === doctorFilter)
    }

    // Apply payment method filter
    if (paymentMethodFilter !== "all") {
      result = result.filter((app) => app.paymentMethod === paymentMethodFilter)
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const today = new Date()

      // Helper function to get start of week
      const getStartOfWeek = (date: Date) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is Sunday
        return new Date(d.setDate(diff))
      }

      // Helper function to get end of week
      const getEndOfWeek = (date: Date) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() + (6 - day) + (day === 0 ? 0 : 0) // adjust when day is Sunday
        return new Date(d.setDate(diff))
      }

      // Helper function to get start of month
      const getStartOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1)
      }

      // Helper function to get end of month
      const getEndOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0)
      }

      // Helper function to get start of year
      const getStartOfYear = (date: Date) => {
        return new Date(date.getFullYear(), 0, 1)
      }

      // Helper function to get end of year
      const getEndOfYear = (date: Date) => {
        return new Date(date.getFullYear(), 11, 31)
      }

      // Helper function to subtract months
      const subMonths = (date: Date, months: number) => {
        const d = new Date(date)
        d.setMonth(d.getMonth() - months)
        return d
      }

      const startOfLastWeek = getStartOfWeek(today)
      const endOfLastWeek = getEndOfWeek(today)

      const startOfLastMonth = getStartOfMonth(today)
      const endOfLastMonth = getEndOfMonth(today)

      const startOfLastYear = getStartOfYear(today)
      const endOfLastYear = getEndOfYear(today)

      const startOfLast3Months = subMonths(today, 3)

      switch (dateFilter) {
        case "week":
          result = result.filter((app) => app.paymentDate >= startOfLastWeek && app.paymentDate <= endOfLastWeek)
          break
        case "month":
          result = result.filter((app) => app.paymentDate >= startOfLastMonth && app.paymentDate <= endOfLastMonth)
          break
        case "3months":
          result = result.filter((app) => app.paymentDate >= startOfLast3Months && app.paymentDate <= today)
          break
        case "year":
          result = result.filter((app) => app.paymentDate >= startOfLastYear && app.paymentDate <= endOfLastYear)
          break
      }
    }

    setFilteredAppointments(result)
  }, [searchQuery, doctorFilter, dateFilter, paymentMethodFilter, appointments])

  // Revenue metrics
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [weeklyRevenue, setWeeklyRevenue] = useState(0)
  const [monthlyRevenue, setMonthlyRevenue] = useState(0)
  const [yearlyRevenue, setYearlyRevenue] = useState(0)
  const [revenueByDoctor, setRevenueByDoctor] = useState<{ [key: string]: number }>({})
  const [revenueByMonth, setRevenueByMonth] = useState<{ [key: string]: number }>({})

  const calculateRevenueMetrics = (completedAppointments: CompletedAppointment[]) => {
    const now = new Date()

    // Helper functions for date calculations
    const getStartOfWeek = (date: Date) => {
      const d = new Date(date)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      return new Date(d.setDate(diff))
    }

    const getStartOfMonth = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth(), 1)
    }

    const getStartOfYear = (date: Date) => {
      return new Date(date.getFullYear(), 0, 1)
    }

    const startOfCurrentWeek = getStartOfWeek(now)
    const startOfCurrentMonth = getStartOfMonth(now)
    const startOfCurrentYear = getStartOfYear(now)

    // Total revenue
    const total = completedAppointments.reduce((sum, app) => sum + app.paymentAmount, 0)
    setTotalRevenue(total)

    // Weekly revenue
    const weekly = completedAppointments
      .filter((app) => app.paymentDate >= startOfCurrentWeek)
      .reduce((sum, app) => sum + app.paymentAmount, 0)
    setWeeklyRevenue(weekly)

    // Monthly revenue
    const monthly = completedAppointments
      .filter((app) => app.paymentDate >= startOfCurrentMonth)
      .reduce((sum, app) => sum + app.paymentAmount, 0)
    setMonthlyRevenue(monthly)

    // Yearly revenue
    const yearly = completedAppointments
      .filter((app) => app.paymentDate >= startOfCurrentYear)
      .reduce((sum, app) => sum + app.paymentAmount, 0)
    setYearlyRevenue(yearly)

    // Revenue by doctor
    const byDoctor: { [key: string]: number } = {}
    completedAppointments.forEach((app) => {
      if (!byDoctor[app.doctorId]) {
        byDoctor[app.doctorId] = 0
      }
      byDoctor[app.doctorId] += app.paymentAmount
    })
    setRevenueByDoctor(byDoctor)

    // Revenue by month
    const byMonth: { [key: string]: number } = {}
    completedAppointments.forEach((app) => {
      const monthYear = formatDate(app.paymentDate, "MMM yyyy")
      if (!byMonth[monthYear]) {
        byMonth[monthYear] = 0
      }
      byMonth[monthYear] += app.paymentAmount
    })
    setRevenueByMonth(byMonth)
  }

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find((d) => d.id === doctorId)
    return doctor ? doctor.name : "Unknown Doctor"
  }

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case "cash":
        return <Badge className="bg-green-500">Cash</Badge>
      case "upi":
        return <Badge className="bg-blue-500">UPI</Badge>
      case "card":
        return <Badge className="bg-purple-500">Card</Badge>
      default:
        return <Badge>{method}</Badge>
    }
  }

  const resetFilters = () => {
    setSearchQuery("")
    setDoctorFilter("all")
    setDateFilter("all")
    setPaymentMethodFilter("all")
  }

  // Format date function to replace date-fns
  const formatDate = (date: Date, format: string) => {
    if (format === "MMM yyyy") {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      return `${months[date.getMonth()]} ${date.getFullYear()}`
    }

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
    return date.toLocaleDateString(undefined, options)
  }

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ["Patient Name", "Doctor", "Date", "Time", "Amount", "Payment Method", "Payment Date"]
    const rows = filteredAppointments.map((app) => [
      app.patientName,
      getDoctorName(app.doctorId),
      formatDate(app.date, "yyyy-MM-dd"),
      app.time,
      app.paymentAmount.toFixed(2),
      app.paymentMethod,
      formatDate(app.paymentDate, "yyyy-MM-dd"),
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `appointment_history_${formatDate(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Successful",
      description: "Appointment history has been exported to CSV.",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading appointment history...</p>
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
        <h1 className="text-3xl font-bold text-zomato-red">Appointment History</h1>
        <p className="text-muted-foreground mt-2">View completed appointments and revenue analytics</p>
      </motion.div>

      <Tabs defaultValue="history" className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Appointment History</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Revenue Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Completed Appointments</CardTitle>
                    <CardDescription>A list of all completed appointments with payment details</CardDescription>
                  </div>
                  <Button variant="outline" className="flex items-center gap-2" onClick={handleExportCSV}>
                    <Download className="h-4 w-4" />
                    <span>Export CSV</span>
                  </Button>
                </div>
              </CardHeader>

              <div className="px-6 pb-2">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by patient or doctor..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
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

                    <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Payment Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Date Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="3months">Last 3 Months</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
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
                    <p className="text-muted-foreground">No completed appointments found.</p>
                    <Button variant="link" onClick={resetFilters} className="mt-2">
                      Reset filters
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto animate-fade-in">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Payment Method</TableHead>
                          <TableHead>Payment Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAppointments.map((appointment) => (
                          <TableRow key={appointment.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{appointment.patientName}</TableCell>
                            <TableCell>{getDoctorName(appointment.doctorId)}</TableCell>
                            <TableCell>{formatDate(appointment.date, "MMM d, yyyy")}</TableCell>
                            <TableCell>{appointment.time}</TableCell>
                            <TableCell className="font-medium">${appointment.paymentAmount.toFixed(2)}</TableCell>
                            <TableCell>{getPaymentMethodBadge(appointment.paymentMethod)}</TableCell>
                            <TableCell>{formatDate(appointment.paymentDate, "MMM d, yyyy")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Revenue</CardDescription>
                  <CardTitle className="text-2xl flex items-center">
                    <DollarSign className="h-5 w-5 text-zomato-red mr-1" />
                    {totalRevenue.toFixed(2)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">From all completed appointments</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Weekly Revenue</CardDescription>
                  <CardTitle className="text-2xl flex items-center">
                    <DollarSign className="h-5 w-5 text-zomato-red mr-1" />
                    {weeklyRevenue.toFixed(2)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Current week</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Monthly Revenue</CardDescription>
                  <CardTitle className="text-2xl flex items-center">
                    <DollarSign className="h-5 w-5 text-zomato-red mr-1" />
                    {monthlyRevenue.toFixed(2)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Current month</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Yearly Revenue</CardDescription>
                  <CardTitle className="text-2xl flex items-center">
                    <DollarSign className="h-5 w-5 text-zomato-red mr-1" />
                    {yearlyRevenue.toFixed(2)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Current year</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-zomato-red" />
                    Revenue by Doctor
                  </CardTitle>
                  <CardDescription>Total revenue generated by each doctor</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(revenueByDoctor).length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No revenue data available</p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(revenueByDoctor).map(([doctorId, amount]) => {
                        const doctor = doctors.find((d) => d.id === doctorId)
                        const doctorName = doctor ? doctor.name : "Unknown Doctor"
                        const percentage = (amount / totalRevenue) * 100

                        return (
                          <div key={doctorId} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{doctorName}</span>
                              <span className="text-sm">${amount.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div className="bg-zomato-red h-2 rounded-full" style={{ width: `${percentage}%` }} />
                            </div>
                            <p className="text-xs text-muted-foreground text-right">
                              {percentage.toFixed(1)}% of total
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-zomato-red" />
                    Monthly Revenue Trend
                  </CardTitle>
                  <CardDescription>Revenue trend over the past months</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(revenueByMonth).length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No revenue data available</p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(revenueByMonth).map(([month, amount]) => {
                        const percentage = (amount / totalRevenue) * 100

                        return (
                          <div key={month} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{month}</span>
                              <span className="text-sm">${amount.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div className="bg-zomato-red h-2 rounded-full" style={{ width: `${percentage}%` }} />
                            </div>
                            <p className="text-xs text-muted-foreground text-right">
                              {percentage.toFixed(1)}% of total
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
