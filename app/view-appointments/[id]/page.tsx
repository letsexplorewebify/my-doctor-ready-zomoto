"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Calendar, Clock, MapPin, Phone, User, FileText } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockApi } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"

export default function AppointmentDetails() {
  const router = useRouter()
  const params = useParams()
  const [appointment, setAppointment] = useState<any>(null)
  const [doctor, setDoctor] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        setLoading(true)

        // In a real app, you would fetch the appointment by ID
        const appointmentsResponse = await mockApi.getAppointments()
        const foundAppointment = appointmentsResponse.data.find((a: any) => a.id === params.id)

        if (!foundAppointment) {
          toast({
            title: "Appointment Not Found",
            description: "The appointment you're looking for doesn't exist.",
            variant: "destructive",
          })
          router.push("/view-appointments")
          return
        }

        setAppointment(foundAppointment)

        // Fetch doctor details
        const doctorsResponse = await mockApi.getDoctors()
        const foundDoctor = doctorsResponse.data.find((d: any) => d.id === foundAppointment.doctorId)

        if (foundDoctor) {
          setDoctor(foundDoctor)
        }
      } catch (error) {
        console.error("Error fetching appointment details:", error)
        toast({
          title: "Error",
          description: "Failed to load appointment details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchAppointmentDetails()
    }
  }, [params.id, router])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500">Confirmed</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      case "cancelled":
        return <Badge className="bg-red-500">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const handleCancel = async () => {
    try {
      await mockApi.deleteAppointment(appointment.id)
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully.",
      })
      router.push("/view-appointments")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel the appointment. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading appointment details...</p>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" className="mb-6" onClick={() => router.push("/view-appointments")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Appointments
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Appointment not found.</p>
            <Button className="mt-4" onClick={() => router.push("/view-appointments")}>
              View All Appointments
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" className="mb-6" onClick={() => router.push("/view-appointments")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Appointments
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">Appointment Details</CardTitle>
                <CardDescription>View your appointment information</CardDescription>
              </div>
              <div>{getStatusBadge(appointment.status)}</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {doctor && (
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl overflow-hidden">
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
                  <h3 className="text-lg font-bold">{doctor.name}</h3>
                  <p className="text-muted-foreground">{doctor.specialization}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-zomato-red" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(appointment.date), "PPP")}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-zomato-red" />
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{appointment.time}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-zomato-red" />
                <div>
                  <p className="text-sm text-muted-foreground">Patient</p>
                  <p className="font-medium">{appointment.patientName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-zomato-red" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{appointment.phoneNumber}</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2">
              <FileText className="h-5 w-5 text-zomato-red mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Reason for Visit</p>
                <p className="font-medium">{appointment.reason}</p>
              </div>
            </div>

            {doctor && doctor.address && (
              <div className="flex items-start gap-3 pt-2">
                <MapPin className="h-5 w-5 text-zomato-red mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{doctor.address}</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push(`/view-appointments`)}>
              Back
            </Button>
            {appointment.status !== "cancelled" && (
              <Button variant="destructive" onClick={handleCancel}>
                Cancel Appointment
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
