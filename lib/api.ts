import axios from "axios"

// Create an axios instance
const api = axios.create({
  baseURL: "/api", // This would be your actual API base URL in production
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Mock data for doctors
const doctors = [
  {
    id: "1",
    name: "Dr. John Smith",
    specialization: "Cardiologist",
    avatar: "JS",
    email: "john.smith@example.com",
    phone: "1234567890",
    experience: "15",
    bio: "Dr. Smith is a board-certified cardiologist with over 15 years of experience in treating heart conditions.",
    address: "123 Medical Center, New York, NY",
    availableTimes: {
      monday: ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM"],
      tuesday: ["1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM"],
      wednesday: ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM"],
      thursday: ["1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM"],
      friday: ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM"],
    },
    unavailableDates: [],
  },
  {
    id: "2",
    name: "Dr. Sarah Johnson",
    specialization: "Dermatologist",
    avatar: "SJ",
    email: "sarah.johnson@example.com",
    phone: "2345678901",
    experience: "10",
    bio: "Dr. Johnson specializes in treating skin conditions and has a particular interest in cosmetic dermatology.",
    address: "456 Skin Care Clinic, Los Angeles, CA",
    availableTimes: {
      monday: ["1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM"],
      wednesday: ["1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM"],
      friday: ["1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM"],
    },
    unavailableDates: [],
  },
  {
    id: "3",
    name: "Dr. Michael Brown",
    specialization: "Neurologist",
    avatar: "MB",
    email: "michael.brown@example.com",
    phone: "3456789012",
    experience: "12",
    bio: "Dr. Brown is a neurologist who specializes in treating headaches, epilepsy, and other neurological disorders.",
    address: "789 Neuro Center, Chicago, IL",
    availableTimes: {
      tuesday: ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM"],
      thursday: ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM"],
      saturday: ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM"],
    },
    unavailableDates: [],
  },
  {
    id: "4",
    name: "Dr. Emily Davis",
    specialization: "Pediatrician",
    avatar: "ED",
    email: "emily.davis@example.com",
    phone: "4567890123",
    experience: "8",
    bio: "Dr. Davis is a pediatrician who loves working with children and has a special interest in childhood development.",
    address: "101 Kids Care, Houston, TX",
    availableTimes: {
      monday: ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM"],
      wednesday: ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM"],
      friday: ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM"],
    },
    unavailableDates: [],
  },
  {
    id: "5",
    name: "Dr. Robert Wilson",
    specialization: "Orthopedic",
    avatar: "RW",
    email: "robert.wilson@example.com",
    phone: "5678901234",
    experience: "20",
    bio: "Dr. Wilson is an orthopedic surgeon with expertise in sports injuries and joint replacements.",
    address: "202 Bone & Joint Clinic, Philadelphia, PA",
    availableTimes: {
      tuesday: ["1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM"],
      thursday: ["1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM"],
      saturday: ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM"],
    },
    unavailableDates: [],
  },
]

// Mock data for appointments
const appointments = [
  {
    id: "1",
    doctorId: "1",
    patientName: "Alice Johnson",
    date: new Date(2023, 6, 15),
    time: "9:00 AM",
    phoneNumber: "1234567890",
    reason: "Regular heart checkup",
    status: "completed",
    paymentStatus: "paid",
    paymentAmount: 150,
    paymentMethod: "card",
    paymentDate: new Date(2023, 6, 15),
  },
  {
    id: "2",
    doctorId: "2",
    patientName: "Bob Smith",
    date: new Date(2023, 6, 16),
    time: "1:30 PM",
    phoneNumber: "2345678901",
    reason: "Skin rash examination",
    status: "confirmed",
    paymentStatus: "unpaid",
  },
  {
    id: "3",
    doctorId: "3",
    patientName: "Charlie Brown",
    date: new Date(2023, 6, 17),
    time: "10:00 AM",
    phoneNumber: "3456789012",
    reason: "Headache consultation",
    status: "pending",
  },
  {
    id: "4",
    doctorId: "4",
    patientName: "Diana Miller",
    date: new Date(2023, 6, 18),
    time: "9:30 AM",
    phoneNumber: "4567890123",
    reason: "Child vaccination",
    status: "completed",
    paymentStatus: "paid",
    paymentAmount: 75,
    paymentMethod: "cash",
    paymentDate: new Date(2023, 6, 18),
  },
  {
    id: "5",
    doctorId: "5",
    patientName: "Edward Wilson",
    date: new Date(2023, 6, 19),
    time: "2:00 PM",
    phoneNumber: "5678901234",
    reason: "Knee pain assessment",
    status: "cancelled",
  },
  {
    id: "6",
    doctorId: "1",
    patientName: "Frank Thomas",
    date: new Date(2023, 7, 5),
    time: "10:30 AM",
    phoneNumber: "6789012345",
    reason: "Blood pressure check",
    status: "completed",
    paymentStatus: "paid",
    paymentAmount: 120,
    paymentMethod: "upi",
    paymentDate: new Date(2023, 7, 5),
  },
  {
    id: "7",
    doctorId: "3",
    patientName: "Grace Lee",
    date: new Date(2023, 7, 10),
    time: "11:00 AM",
    phoneNumber: "7890123456",
    reason: "Migraine follow-up",
    status: "completed",
    paymentStatus: "paid",
    paymentAmount: 180,
    paymentMethod: "card",
    paymentDate: new Date(2023, 7, 10),
  },
  {
    id: "8",
    doctorId: "2",
    patientName: "Henry Garcia",
    date: new Date(2023, 7, 15),
    time: "2:30 PM",
    phoneNumber: "8901234567",
    reason: "Acne treatment",
    status: "confirmed",
  },
  {
    id: "9",
    doctorId: "5",
    patientName: "Isabella Martinez",
    date: new Date(2023, 7, 20),
    time: "9:00 AM",
    phoneNumber: "9012345678",
    reason: "Shoulder pain",
    status: "completed",
    paymentStatus: "paid",
    paymentAmount: 200,
    paymentMethod: "cash",
    paymentDate: new Date(2023, 7, 20),
  },
  {
    id: "10",
    doctorId: "4",
    patientName: "Jack Wilson",
    date: new Date(2023, 7, 25),
    time: "10:00 AM",
    phoneNumber: "0123456789",
    reason: "Annual checkup",
    status: "pending",
  },
]

// Mock API endpoints
export const mockApi = {
  // Doctors
  getDoctors: async () => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    return { data: doctors }
  },

  addDoctor: async (doctor: any) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const newDoctor = {
      id: (doctors.length + 1).toString(),
      ...doctor,
      avatar: doctor.name
        .split(" ")
        .map((n: string) => n[0])
        .join(""),
      unavailableDates: doctor.unavailableDates || [],
    }
    doctors.push(newDoctor)
    return { data: newDoctor }
  },

  updateDoctor: async (doctor: any) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const index = doctors.findIndex((d) => d.id === doctor.id)
    if (index !== -1) {
      doctors[index] = {
        ...doctors[index],
        ...doctor,
      }
    }

    return { data: doctors[index] }
  },

  deleteDoctor: async (doctorId: string) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    const index = doctors.findIndex((d) => d.id === doctorId)
    if (index !== -1) {
      doctors.splice(index, 1)
    }

    return { data: { success: true } }
  },

  // Appointments
  getAppointments: async () => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return { data: appointments }
  },

  addAppointment: async (appointment: any) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1200))

    // Check if the doctor is available on the selected date
    const doctor = doctors.find((d) => d.id === appointment.doctorId)
    if (doctor && doctor.unavailableDates) {
      const appointmentDate = new Date(appointment.date)

      // Check if the date is in the unavailable dates list
      const isUnavailable = doctor.unavailableDates.some((unavailableDate: string) => {
        const date = new Date(unavailableDate)
        return (
          date.getFullYear() === appointmentDate.getFullYear() &&
          date.getMonth() === appointmentDate.getMonth() &&
          date.getDate() === appointmentDate.getDate()
        )
      })

      if (isUnavailable) {
        throw new Error("The doctor is not available on the selected date")
      }
    }

    const newAppointment = {
      id: (appointments.length + 1).toString(),
      ...appointment,
      status: "pending",
    }
    appointments.push(newAppointment)
    return { data: newAppointment }
  },

  updateAppointment: async (appointment: any) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    const index = appointments.findIndex((a) => a.id === appointment.id)
    if (index !== -1) {
      appointments[index] = {
        ...appointments[index],
        ...appointment,
      }
    }

    return { data: appointments[index] }
  },

  deleteAppointment: async (id: string) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    const index = appointments.findIndex((a) => a.id === id)
    if (index !== -1) {
      appointments.splice(index, 1)
    }
    return { data: { success: true } }
  },
}

export default api
