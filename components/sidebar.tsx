"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { CalendarDays, Menu, PlusCircle, Users, Calendar, UserCog, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./theme-toggle"
import { motion } from "framer-motion"

const routes = [
  {
    name: "Book Appointment",
    path: "/",
    icon: <CalendarDays className="h-5 w-5" />,
  },
  {
    name: "View Appointments",
    path: "/view-appointments",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    name: "Appointment History",
    path: "/appointment-history",
    icon: <History className="h-5 w-5" />,
  },
  {
    name: "Add Doctor",
    path: "/add-doctor",
    icon: <PlusCircle className="h-5 w-5" />,
  },
  {
    name: "Manage Doctors",
    path: "/view-doctors",
    icon: <UserCog className="h-5 w-5" />,
  },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const NavItems = () => (
    <>
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-6 px-4">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <div className="bg-zomato-red rounded-full p-1.5">
              <Users className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">DocTime</h2>
          </Link>
          <ThemeToggle />
        </div>
        <div className="space-y-1">
          {routes.map((route, index) => (
            <Link key={route.path} href={route.path} onClick={() => setOpen(false)}>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant={pathname === route.path ? "default" : "ghost"}
                  className={cn("w-full justify-start", {
                    "bg-primary text-primary-foreground": pathname === route.path,
                  })}
                >
                  {route.icon}
                  <span className="ml-2">{route.name}</span>
                </Button>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="outline" size="icon" className="ml-2 mt-2 rounded-full">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] sm:w-[300px] border-r">
          <NavItems />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-background md:block w-[240px] lg:w-[280px]">
        <div className="flex h-full flex-col py-4">
          <NavItems />
        </div>
      </div>
    </>
  )
}
