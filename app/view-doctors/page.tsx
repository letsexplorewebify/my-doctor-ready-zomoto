"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format, isSameDay } from "date-fns"
import { motion } from "framer-motion"
import {
  Edit,
  Trash2,
  Calendar,
  User,
  Mail,
  Phone,
  Award,
  FileText,
  Clock,
  Upload,
  X,
  AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { mockApi } from "@/lib/api"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

// Form schema
const doctorFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  specialization: z.string({
    required_error: "Please select a specialization.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
  experience: z.string().min(1, {
    message: "Please enter years of experience.",
  }),
  bio: z.string().min(10, {
    message: "Bio must be at least 10 characters.",
  }),
  address: z.string().optional(),
  availableTimes: z
    .object({
      monday: z.array(z.string()).optional(),
      tuesday: z.array(z.string()).optional(),
      wednesday: z.array(z.string()).optional(),
      thursday: z.array(z.string()).optional(),
      friday: z.array(z.string()).optional(),
      saturday: z.array(z.string()).optional(),
      sunday: z.array(z.string()).optional(),
    })
    .optional(),
  unavailableDates: z.array(z.date()).optional(),
})

// Specializations
const specializations = [
  "Cardiologist",
  "Dermatologist",
  "Neurologist",
  "Pediatrician",
  "Orthopedic",
  "Gynecologist",
  "Ophthalmologist",
  "Psychiatrist",
  "Dentist",
  "General Physician",
]

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

const timeSlots = generateTimeSlots()
const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

export default function ViewDoctors() {
  const router = useRouter()
  const [doctors, setDoctors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingDoctor, setEditingDoctor] = useState<any | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showUnavailableDatesDialog, setShowUnavailableDatesDialog] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  const form = useForm<z.infer<typeof doctorFormSchema>>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      experience: "",
      bio: "",
      address: "",
      availableTimes: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      },
      unavailableDates: [],
    },
  })

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

  const handleEditDoctor = (doctor: any) => {
    setEditingDoctor(doctor)
    setImagePreview(doctor.imageUrl || null)

    // Convert unavailable dates from strings to Date objects if they exist
    const unavailableDates = doctor.unavailableDates
      ? doctor.unavailableDates.map((date: string) => new Date(date))
      : []

    setSelectedDates(unavailableDates)

    form.reset({
      ...doctor,
      unavailableDates,
    })

    setShowEditDialog(true)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setImageFile(null)
  }

  const handleManageUnavailableDates = (doctor: any) => {
    setEditingDoctor(doctor)

    // Convert unavailable dates from strings to Date objects if they exist
    const unavailableDates = doctor.unavailableDates
      ? doctor.unavailableDates.map((date: string) => new Date(date))
      : []

    setSelectedDates(unavailableDates)
    setShowUnavailableDatesDialog(true)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDates((prev) => {
      // Check if the date is already selected
      const isSelected = prev.some((d) => isSameDay(d, date))

      if (isSelected) {
        // If selected, remove it
        return prev.filter((d) => !isSameDay(d, date))
      } else {
        // If not selected, add it
        return [...prev, date]
      }
    })
  }

  const saveUnavailableDates = async () => {
    if (!editingDoctor) return

    setIsSubmitting(true)

    try {
      // Convert dates to ISO strings for storage
      const dateStrings = selectedDates.map((date) => date.toISOString())

      // Update the doctor with the new unavailable dates
      const updatedDoctor = {
        ...editingDoctor,
        unavailableDates: dateStrings,
      }

      await mockApi.updateDoctor(updatedDoctor)

      // Update the local state
      setDoctors((prev) => prev.map((doc) => (doc.id === editingDoctor.id ? updatedDoctor : doc)))

      toast({
        title: "Success",
        description: "Unavailable dates have been updated successfully.",
      })

      setShowUnavailableDatesDialog(false)
    } catch (error) {
      console.error("Error updating unavailable dates:", error)
      toast({
        title: "Error",
        description: "Failed to update unavailable dates. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof doctorFormSchema>) => {
    if (!editingDoctor) return

    setIsSubmitting(true)

    try {
      // In a real app, you would upload the image to a storage service
      // and get a URL back to store with the doctor data
      const imageUrl = imagePreview

      // Add the image URL to the doctor data
      const doctorData = {
        ...editingDoctor,
        ...values,
        imageUrl,
      }

      await mockApi.updateDoctor(doctorData)

      // Update the local state
      setDoctors((prev) => prev.map((doc) => (doc.id === editingDoctor.id ? doctorData : doc)))

      toast({
        title: "Doctor Updated",
        description: `${values.name}'s information has been successfully updated.`,
      })

      setShowEditDialog(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error updating the doctor. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteDoctor = async (doctorId: string) => {
    if (!confirm("Are you sure you want to delete this doctor? This action cannot be undone.")) {
      return
    }

    try {
      await mockApi.deleteDoctor(doctorId)

      // Update the local state
      setDoctors((prev) => prev.filter((doc) => doc.id !== doctorId))

      toast({
        title: "Doctor Deleted",
        description: "The doctor has been successfully deleted.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the doctor. Please try again.",
        variant: "destructive",
      })
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
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-zomato-red">Manage Doctors</h1>
        <p className="text-muted-foreground mt-2">View, edit, and manage doctor information and availability</p>
      </motion.div>

      {doctors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No doctors found in the system.</p>
            <Button onClick={() => router.push("/add-doctor")}>Add a Doctor</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-4">
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
                    <div className="flex-1">
                      <CardTitle className="text-xl">{doctor.name}</CardTitle>
                      <CardDescription>{doctor.specialization}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 text-zomato-red mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p>{doctor.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-zomato-red mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p>{doctor.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Award className="h-4 w-4 text-zomato-red mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground">Experience</p>
                        <p>{doctor.experience} years</p>
                      </div>
                    </div>
                    {doctor.address && (
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-zomato-red mt-1" />
                        <div>
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p>{doctor.address}</p>
                        </div>
                      </div>
                    )}
                    {doctor.unavailableDates && doctor.unavailableDates.length > 0 && (
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-1" />
                        <div>
                          <p className="text-sm text-muted-foreground">Unavailable Dates</p>
                          <p>{doctor.unavailableDates.length} day(s) marked as unavailable</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => handleManageUnavailableDates(doctor)}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Availability</span>
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEditDoctor(doctor)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteDoctor(doctor.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Doctor Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Doctor Information</DialogTitle>
            <DialogDescription>Update the doctor's details and availability</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted mb-4">
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Doctor preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <User className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="doctor-image-edit"
                    className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload Photo</span>
                  </label>
                  <input
                    id="doctor-image-edit"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              <Tabs defaultValue="basic">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Information</TabsTrigger>
                  <TabsTrigger value="availability">Availability</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4 text-zomato-red" />
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Dr. John Smith" {...field} className="rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specialization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-zomato-red" />
                          Specialization
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Select a specialization" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {specializations.map((specialization) => (
                              <SelectItem key={specialization} value={specialization}>
                                {specialization}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-zomato-red" />
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="doctor@example.com" {...field} className="rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-zomato-red" />
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="1234567890" {...field} className="rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="experience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-zomato-red" />
                            Years of Experience
                          </FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="5" {...field} className="rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-zomato-red" />
                            Address
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="123 Medical St, City" {...field} className="rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-zomato-red" />
                          Bio
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of the doctor's background and expertise"
                            className="resize-none rounded-xl"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="availability" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-zomato-red" />
                      <h3 className="font-medium">Available Times</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Select the days and times when the doctor is available for appointments
                    </p>

                    {weekdays.map((day) => (
                      <div key={day} className="mb-4">
                        <h4 className="font-medium capitalize mb-2">{day}</h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                          {timeSlots.map((time) => (
                            <FormField
                              key={`${day}-${time}`}
                              control={form.control}
                              name={`availableTimes.${day}`}
                              render={({ field }) => {
                                // Ensure field.value is always an array
                                const currentValue = field.value || []
                                const isSelected = currentValue.includes(time)

                                return (
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => {
                                          const newValue = checked
                                            ? [...currentValue, time]
                                            : currentValue.filter((t) => t !== time)
                                          field.onChange(newValue)
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-xs cursor-pointer">{time}</FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Manage Unavailable Dates Dialog */}
      <Dialog open={showUnavailableDatesDialog} onOpenChange={setShowUnavailableDatesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Unavailable Dates</DialogTitle>
            <DialogDescription>Mark dates when the doctor will not be available for appointments</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Click on dates to mark them as unavailable. Patients will not be able to book appointments on these
                dates.
              </p>
            </div>

            <div className="border rounded-md p-4">
              <CalendarComponent
                mode="multiple"
                selected={selectedDates}
                onSelect={setSelectedDates}
                className="mx-auto"
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                disabled={[
                  { before: new Date() }, // Disable dates in the past
                ]}
                modifiers={{
                  selected: selectedDates,
                }}
                modifiersClassNames={{
                  selected: "bg-red-500 text-white hover:bg-red-600",
                }}
              />
            </div>

            {selectedDates.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Selected Unavailable Dates:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDates
                    .sort((a, b) => a.getTime() - b.getTime())
                    .map((date, index) => (
                      <div
                        key={index}
                        className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center gap-1"
                      >
                        <span>{format(date, "MMM d, yyyy")}</span>
                        <button
                          type="button"
                          onClick={() => handleDateSelect(date)}
                          className="text-red-800 hover:text-red-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowUnavailableDatesDialog(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveUnavailableDates} disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
