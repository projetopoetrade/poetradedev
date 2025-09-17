'use client'

import { useState, ReactNode } from 'react'
import { useTheme } from 'next-themes'
import { Check, Moon, Sun, Monitor } from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { useCurrency } from '@/lib/contexts/currency-context'

interface UserSettingsProps {
  triggerComponent?: ReactNode;
}

export function UserSettings({ triggerComponent }: UserSettingsProps) {
  const { theme, setTheme } = useTheme()
  const { currency, setCurrency } = useCurrency()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState({
    productUpdates: true,
    newReleases: true,
    priceAlerts: false
  })
  const [fontScale, setFontScale] = useState(100)

  const handleResetSettings = () => {
    setTheme('system')
    setNotifications({
      productUpdates: true,
      newReleases: true,
      priceAlerts: false
    })
    setCurrency('USD')
    setFontScale(100)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerComponent || (
          <Button variant="outline" className="h-9">Settings</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">User Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="appearance" className="mt-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-6 pt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Theme</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {theme === 'light' && (
                      <>
                        <Sun className="h-4 w-4 mr-2" />
                        <span>Light</span>
                      </>
                    )}
                    {theme === 'dark' && (
                      <>
                        <Moon className="h-4 w-4 mr-2" />
                        <span>Dark</span>
                      </>
                    )}
                    {theme === 'system' && (
                      <>
                        <Monitor className="h-4 w-4 mr-2" />
                        <span>System</span>
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun className="h-4 w-4 mr-2" />
                    <span>Light</span>
                    {theme === 'light' && <Check className="h-4 w-4 ml-auto" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className="h-4 w-4 mr-2" />
                    <span>Dark</span>
                    {theme === 'dark' && <Check className="h-4 w-4 ml-auto" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')}>
                    <Monitor className="h-4 w-4 mr-2" />
                    <span>System</span>
                    {theme === 'system' && <Check className="h-4 w-4 ml-auto" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="font-scale">Font Size</Label>
                <span className="text-sm text-muted-foreground">{fontScale}%</span>
              </div>
              <Slider
                id="font-scale"
                min={75}
                max={150}
                step={5}
                value={[fontScale]}
                onValueChange={(value) => setFontScale(value[0])}
              />
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="product-updates">Product Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about product updates
                  </p>
                </div>
                <Switch
                  id="product-updates"
                  checked={notifications.productUpdates}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, productUpdates: checked})
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="new-releases">New Releases</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new leagues are released
                  </p>
                </div>
                <Switch
                  id="new-releases"
                  checked={notifications.newReleases}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, newReleases: checked})
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="price-alerts">Price Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Be alerted when product prices change
                  </p>
                </div>
                <Switch
                  id="price-alerts"
                  checked={notifications.priceAlerts}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, priceAlerts: checked})
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6 pt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Currency Format</h3>
              <RadioGroup 
                value={currency} 
                onValueChange={setCurrency}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="USD" id="USD" />
                  <Label htmlFor="USD">USD ($)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="EUR" id="EUR" />
                  <Label htmlFor="EUR">EUR (€)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="GBP" id="GBP" />
                  <Label htmlFor="GBP">GBP (£)</Label>
                </div>
              </RadioGroup>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleResetSettings}
          >
            Reset to Defaults
          </Button>
          <Button onClick={() => setIsOpen(false)}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 