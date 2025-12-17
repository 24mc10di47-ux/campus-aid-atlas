import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, Search, Users, ShoppingBag, LogOut, GraduationCap, User } from 'lucide-react';

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?mode=login');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const modules = [
    {
      icon: MapPin,
      title: 'Campus Maps',
      description: 'Navigate campus with live directions. Find buildings, classrooms, and facilities.',
      path: '/maps',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Search,
      title: 'Lost & Found',
      description: 'Report lost items or help reunite found belongings with their owners.',
      path: '/lost-found',
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      icon: Users,
      title: 'Club Information',
      description: 'Explore student clubs, events, members, and recruitment opportunities.',
      path: '/clubs',
      color: 'bg-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: ShoppingBag,
      title: 'Campus Shops',
      description: 'Discover on-campus shops, canteens, menus, prices, and timings.',
      path: '/shops',
      color: 'bg-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold">MITS Portal</h1>
                <p className="text-muted-foreground text-xs">Student Dashboard</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="hidden sm:inline text-muted-foreground">{user?.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-10 animate-fade-in">
          <h2 className="font-display text-3xl font-bold text-foreground mb-2">
            Welcome back!
          </h2>
          <p className="text-muted-foreground text-lg">
            What would you like to explore today?
          </p>
        </div>

        {/* Module Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {modules.map((module, index) => (
            <Link
              key={module.title}
              to={module.path}
              className="module-card group animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-5">
                <div className={`w-16 h-16 rounded-xl ${module.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  <module.icon className={`w-8 h-8 ${module.color.replace('bg-', 'text-')}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {module.description}
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-5 border-t border-border">
                <span className="text-primary font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
                  Explore {module.title.split(' ')[0]}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Access - Maps (No login required) */}
        <div className="mt-10 p-6 rounded-xl bg-primary/5 border border-primary/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                Quick Access: Campus Maps
              </h3>
              <p className="text-muted-foreground text-sm">
                Maps are accessible without login. Share this link with anyone!
              </p>
            </div>
            <Link to="/maps">
              <Button variant="default">
                <MapPin className="w-4 h-4" />
                Open Maps
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
