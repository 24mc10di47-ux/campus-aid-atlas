import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin, Search, Users, ShoppingBag, GraduationCap, ChevronDown } from 'lucide-react';
import heroCampus from '@/assets/college-campus.png';
const Landing = () => {
  const features = [{
    icon: MapPin,
    title: 'Campus Maps',
    description: 'Navigate campus with ease. Find buildings, classrooms, and facilities instantly.'
  }, {
    icon: Search,
    title: 'Lost & Found',
    description: 'Report lost items or help reunite found belongings with their owners.'
  }, {
    icon: Users,
    title: 'Club Information',
    description: 'Explore student clubs, upcoming events, and recruitment opportunities.'
  }, {
    icon: ShoppingBag,
    title: 'Campus Shops',
    description: 'Discover on-campus shops, canteens, menus, and timings.'
  }];
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  return <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
        backgroundImage: `url(${heroCampus})`
      }} />
        <div className="hero-overlay" />
        
        {/* Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-20 p-6">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-primary-foreground font-display text-xl font-bold">MITS Gwalior</h1>
                <p className="text-primary-foreground/70 text-sm">Student Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/maps">
                <Button variant="heroOutline" size="sm">
                  <MapPin className="w-4 h-4" />
                  Campus Map
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in">
          <div className="mb-6">
            <span className="inline-block px-4 py-2 rounded-full bg-secondary/20 text-secondary text-sm font-medium backdrop-blur-sm border border-secondary/30">
              Welcome to MITS Student Portal
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
            Your Campus,
            <br />
            <span className="text-secondary">Simplified</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Navigate campus, find lost items, explore clubs, and discover shops—all in one place. 
            Making student life easier at MITS Gwalior.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth?mode=signup">
              <Button variant="gold" size="xl">
                Get Started
              </Button>
            </Link>
            <Link to="/auth?mode=login">
              <Button variant="heroOutline" size="xl">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <button onClick={scrollToFeatures} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-primary-foreground/60 hover:text-primary-foreground transition-colors animate-bounce">
          <ChevronDown className="w-8 h-8" />
        </button>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-slide-up">
            <span className="text-primary font-medium mb-2 block">Features</span>
            <h2 className="section-title">Everything You Need</h2>
            <p className="section-subtitle max-w-2xl mx-auto mt-4">
              Access essential campus resources designed to solve common student problems
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => <div key={feature.title} className="module-card group" style={{
            animationDelay: `${index * 100}ms`
          }}>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-secondary rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of MITS students who use our portal daily. Sign up with your college email to access all features.
          </p>
          <Link to="/auth?mode=signup">
            <Button variant="gold" size="xl">
              Create Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-foreground">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-background font-display font-semibold">MITS Gwalior</h3>
                <p className="text-background/60 text-sm">Student Portal</p>
              </div>
            </div>
            <p className="text-background/60 text-sm">© 2025 MITS Student Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Landing;