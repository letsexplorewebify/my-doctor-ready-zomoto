"use client"

import type React from "react"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { User, Mail, Phone, Award, FileText, Clock, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockApi } from "@/lib/api"
import { Checkbox } from "@/components/ui/checkbox"

// Form schema
const formSchema = z.object({
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

export default function AddDoctor() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
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
    },
  })

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      // In a real app, you would upload the image to a storage service
      // and get a URL back to store with the doctor data
      let imageUrl = null
      if (imagePreview) {
        // Mock image upload - in a real app, this would be an actual upload
        imageUrl = imagePreview
      }

      // Add the image URL to the doctor data
      const doctorData = {
        ...values,
        imageUrl,
      }

      await mockApi.addDoctor(doctorData)

      toast({
        title: "Doctor Added",
        description: `${values.name} has been successfully added to the system.`,
      })

      form.reset()
      setImagePreview(null)
      setImageFile(null)
      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error adding the doctor. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-zomato-red">Add New Doctor</h1>
        <p className="text-muted-foreground mt-2">Add a new specialist to your appointment system</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Doctor Information</CardTitle>
            <CardDescription>Enter the details of the new doctor below</CardDescription>
          </CardHeader>
          <CardContent>
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
                      htmlFor="doctor-image"
                      className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload Photo</span>
                    </label>
                    <input
                      id="doctor-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>

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

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full py-6 rounded-xl bg-zomato-red hover:bg-zomato-darkRed text-white font-bold text-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Adding...</span>
                      </div>
                    ) : (
                      "Add Doctor"
                    )}
                  </Button>
                </motion.div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
