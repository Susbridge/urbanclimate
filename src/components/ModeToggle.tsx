import { Moon, Sun } from "lucide-react"
import { useTheme } from "./ThemeProvider"
import { Button } from "./ui/button"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === "auto") {
      const hour = new Date().getHours()
      const isDayTime = hour >= 7 && hour < 19
      setTheme(isDayTime ? "dark" : "light")
    } else {
      setTheme(theme === "light" ? "dark" : "light")
    }
  }

  return (
    <Button variant="outline" size="icon" className="rounded-full" onClick={toggleTheme}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
