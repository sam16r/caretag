import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Calendar, Clock, TrendingUp, User, Pill, Activity } from 'lucide-react';

export function PlayfulCardDemo() {
  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-sky-50 via-white to-violet-50 min-h-screen">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
          ✨ Playful UI Demo
        </h1>
        <p className="text-muted-foreground">Blinkit / Apollo 24|7 inspired design</p>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: User, label: 'Patients', value: '248', color: 'bg-blue-500', bgLight: 'bg-blue-50' },
          { icon: Calendar, label: 'Today', value: '12', color: 'bg-emerald-500', bgLight: 'bg-emerald-50' },
          { icon: Pill, label: 'Scripts', value: '89', color: 'bg-amber-500', bgLight: 'bg-amber-50' },
          { icon: Activity, label: 'Critical', value: '3', color: 'bg-rose-500', bgLight: 'bg-rose-50' },
        ].map((stat, i) => (
          <div
            key={i}
            className={`${stat.bgLight} rounded-3xl p-4 border-2 border-transparent hover:border-current hover:scale-105 transition-all duration-300 cursor-pointer group`}
            style={{ borderColor: 'transparent' }}
          >
            <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:rotate-6 transition-transform`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Patient Card - Playful Style */}
      <Card className="rounded-3xl border-2 border-transparent hover:border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full" />
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  JD
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Heart className="h-3 w-3 text-white fill-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-lg">John Doe</CardTitle>
                <p className="text-sm text-muted-foreground">Male, 45 years</p>
                <div className="flex gap-2 mt-2">
                  <Badge className="rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 px-3">
                    A+ Blood
                  </Badge>
                  <Badge className="rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 px-3">
                    Diabetic
                  </Badge>
                </div>
              </div>
            </div>
            <Button size="sm" className="rounded-full bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all">
              View Profile
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { icon: Clock, label: 'Last Visit', value: '2 days ago', bg: 'bg-sky-50' },
              { icon: TrendingUp, label: 'Health Score', value: '78/100', bg: 'bg-emerald-50' },
              { icon: Pill, label: 'Active Meds', value: '3 items', bg: 'bg-violet-50' },
            ].map((item, i) => (
              <div key={i} className={`${item.bg} rounded-2xl p-3 text-center hover:scale-105 transition-transform cursor-pointer`}>
                <item.icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="font-semibold text-sm">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions - Pill Buttons */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {['📅 Book Appointment', '💊 New Prescription', '🔬 Order Lab Test', '📞 Start Call', '📝 Add Notes'].map((action, i) => (
            <Button
              key={i}
              variant="outline"
              className="rounded-full px-5 py-2 border-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-violet-50 hover:border-blue-300 hover:scale-105 transition-all duration-200"
            >
              {action}
            </Button>
          ))}
        </div>
      </div>

      {/* Appointment Card */}
      <Card className="rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Calendar className="h-7 w-7" />
              </div>
              <div>
                <p className="text-emerald-100 text-sm">Next Appointment</p>
                <p className="text-xl font-bold">Today, 2:30 PM</p>
                <p className="text-emerald-100">Dr. Sarah Wilson - Cardiology</p>
              </div>
            </div>
            <Button className="rounded-full bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg px-6">
              Join Now
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        👆 This is a preview of the playful style. Want me to apply this across the app?
      </p>
    </div>
  );
}
