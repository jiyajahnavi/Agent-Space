"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User as UserIcon, Zap, Globe, LogOut, PlusCircle, Sparkles, LogIn, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const CactusIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 22v-9" />
    <path d="M8 13v-5a4 4 0 1 1 8 0v4" />
    <path d="M8 13h0a4 4 0 0 0-4-4v1a4 4 0 0 0 4 4Z" />
    <path d="M16 11h0a4 4 0 0 1 4 4v-1a4 4 0 0 1-4-4Z" />
  </svg>
);

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { toast } = useToast();

  const navLinks = [
    { name: 'Explore', href: '/explore', icon: Globe },
    { name: 'Battle', href: '/battle', icon: Zap },
  ];

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed Out",
      description: "You have been safely signed out.",
    });
    router.push('/');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AS';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        
        {/* Left Side: Top-Left Profile Button + Brand + Nav Links */}
        <div className="flex items-center gap-4">
          
          {/* PROFILE BUTTON AT LEFT TOP (Authentication Entry & Menu) */}
          <div className="flex items-center">
            {profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 px-2 flex items-center gap-2 rounded-full border border-border/80 hover:bg-muted/80 transition-all group"
                  >
                    <div className="relative">
                      <Avatar className="h-7 w-7 border border-primary/30">
                        <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                          {getInitials(profile.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-background" />
                    </div>
                    <span className="text-xs font-semibold max-w-[100px] truncate hidden sm:inline-block">
                      {profile.fullName.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-transform group-data-[state=open]:rotate-180" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 p-1.5 rounded-xl mt-1 shadow-xl bg-card border-border/80">
                  <DropdownMenuLabel className="font-normal p-2 pb-1.5">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">{profile.fullName}</p>
                      <p className="text-xs leading-none text-muted-foreground">@{profile.username}</p>
                      <div className="mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary w-fit">
                        {profile.provider === 'google' ? 'Google OAuth Account' : profile.provider === 'github' ? 'GitHub OAuth Account' : profile.email}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                    <Link href={`/profile/${profile.username}`} className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-primary" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                    <Link href="/create" className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4 text-emerald-500" />
                      <span>Create Agent</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive rounded-lg">
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 gap-1.5 rounded-full border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary font-medium transition-all shadow-sm group"
                asChild
              >
                <Link href="/auth">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <UserIcon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-semibold">Profile / Sign In</span>
                </Link>
              </Button>
            )}
          </div>

          <div className="h-4 w-[1px] bg-border/80 hidden sm:block" />

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform bg-primary border border-primary/20 shadow-sm">
              <CactusIcon className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-headline font-bold text-lg tracking-tight hidden xs:inline-block">Agent<span className="text-primary">Space</span></span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 px-2 py-1 rounded-md",
                  pathname.startsWith(link.href) ? "text-primary bg-primary/10" : "text-muted-foreground"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Right Side: Create Agent Action Button */}
        <div className="flex items-center gap-2">
          <Button className="bg-primary hover:bg-primary/90 text-white font-medium shadow-sm h-9 px-4 rounded-xl" asChild>
            <Link href="/create" className="flex items-center gap-1.5">
              <PlusCircle className="h-4 w-4" />
              <span>Create</span>
            </Link>
          </Button>
        </div>

      </div>
    </nav>
  );
}
