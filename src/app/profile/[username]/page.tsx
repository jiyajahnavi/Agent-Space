"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, MapPin, Link as LinkIcon, Twitter, Users, Star, BookOpen, GitBranch, GitPullRequest, CircleDot, Clock, User, Plus, UserPlus, UserCheck, ArrowRight, Edit3, Loader2, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MOCK_USER } from '@/lib/data';
import { AgentCard } from '@/components/agent-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAgents } from '@/context/agents-context';
import { useAuth } from '@/context/auth-context';
import { useFollow } from '@/context/follow-context';
import { toast } from '@/hooks/use-toast';

export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { agents } = useAgents();
    const { profile, updateProfile } = useAuth();
    const { followUser, unfollowUser, isFollowing, getFollowers, getFollowing } = useFollow();

    const rawParamUser = typeof params.username === 'string' ? decodeURIComponent(params.username) : '';
    const cleanParamUser = rawParamUser.replace(/^@/, '').trim();
    
    // Determine if viewing own profile
    const isSelf = !!(profile && (
        !cleanParamUser || 
        profile.username.toLowerCase().replace(/^@/, '') === cleanParamUser.toLowerCase() ||
        profile.email?.split('@')[0].toLowerCase() === cleanParamUser.toLowerCase()
    ));

    const isAddyDemo = cleanParamUser.toLowerCase() === 'addy';

    // Get real followers & following lists
    const targetUsername = isAddyDemo ? 'addy' : (isSelf && profile ? profile.username : cleanParamUser || 'developer');
    const followersList = getFollowers(targetUsername);
    const followingList = getFollowing(targetUsername);

    // Construct active user profile with real follower counts
    const user = isAddyDemo ? {
        name: 'Aditya Singh',
        username: 'addy',
        bio: 'Building the future of autonomous systems. Lead Engineer at NeuralStack. Open source contributor.',
        avatar: 'https://picsum.photos/seed/alex/200/200',
        followers: followersList.length,
        following: followingList.length,
        location: 'San Francisco, CA',
        website: 'https://alexrivera.dev',
        twitter: 'addy_ai',
    } : (isSelf && profile ? {
        name: profile.fullName || profile.username,
        username: profile.username,
        bio: profile.bio || "AI Agent Builder on AgentSpace.",
        avatar: profile.avatarUrl,
        followers: followersList.length,
        following: followingList.length,
        location: profile.location || "",
        website: profile.website || "",
        twitter: profile.twitter || "",
    } : {
        name: cleanParamUser || 'Developer',
        username: cleanParamUser || 'developer',
        bio: "AgentSpace AI Developer",
        avatar: "",
        followers: followersList.length,
        following: followingList.length,
        location: "",
        website: "",
        twitter: "",
    });

    const isUserFollowed = isFollowing(user.username);

    // Dialog state for viewing Followers/Following list
    const [dialogMode, setDialogMode] = useState<'followers' | 'following' | null>(null);

    // Dialog state for Edit Profile
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFullName, setEditFullName] = useState('');
    const [editUsername, setEditUsername] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [editWebsite, setEditWebsite] = useState('');
    const [editTwitter, setEditTwitter] = useState('');
    const [editAvatarUrl, setEditAvatarUrl] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const handleOpenEditModal = () => {
        setEditFullName(user.name || '');
        setEditUsername(user.username || '');
        setEditBio(user.bio || '');
        setEditLocation(user.location || '');
        setEditWebsite(user.website || '');
        setEditTwitter(user.twitter || '');
        setEditAvatarUrl(user.avatar || '');
        setIsEditModalOpen(true);
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editUsername.trim()) {
            toast({ title: "Error", description: "Username cannot be empty.", variant: "destructive" });
            return;
        }

        setIsSavingProfile(true);
        try {
            const cleanNewUsername = editUsername.trim().replace(/^@/, '').toLowerCase();
            await updateProfile({
                fullName: editFullName.trim(),
                username: cleanNewUsername,
                bio: editBio.trim(),
                location: editLocation.trim(),
                website: editWebsite.trim(),
                twitter: editTwitter.trim().replace(/^@/, ''),
                avatarUrl: editAvatarUrl.trim() || undefined,
            });

            toast({ title: "Profile Updated", description: "Your profile details have been saved!" });
            setIsEditModalOpen(false);

            if (cleanNewUsername !== user.username.toLowerCase()) {
                router.push(`/profile/@${cleanNewUsername}`);
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleFollowToggle = () => {
        if (!profile) {
            toast({
                title: "Authentication Required",
                description: "Please sign in to follow developers on AgentSpace.",
                variant: "destructive"
            });
            return;
        }

        if (isSelf) {
            toast({
                title: "Action Not Allowed",
                description: "You cannot follow your own profile.",
                variant: "destructive"
            });
            return;
        }

        if (isUserFollowed) {
            unfollowUser(user.username);
            toast({
                title: "Unfollowed",
                description: `You unfollowed @${user.username}.`,
            });
        } else {
            followUser(user.username, user.name);
            toast({
                title: "Following",
                description: `You are now following @${user.username}!`,
            });
        }
    };

    // Filter agents strictly belonging to this user
    const userAgents = agents.filter(a => {
        const ownerClean = a.owner.toLowerCase().replace(/^@/, '');
        const targetClean = targetUsername.toLowerCase().replace(/^@/, '');
        const paramClean = cleanParamUser.toLowerCase();
        const profileClean = profile?.username?.toLowerCase().replace(/^@/, '');
        const emailPrefix = profile?.email?.split('@')[0]?.toLowerCase();

        return (
            ownerClean === targetClean ||
            ownerClean === paramClean ||
            (isSelf && (ownerClean === profileClean || ownerClean === emailPrefix))
        );
    });
    const pinnedAgents = userAgents.slice(0, 4);

    // Calculate total stars accumulated across created agents
    const totalStars = userAgents.reduce((acc, a) => acc + (a.stars || 0), 0);

    const [contributionDays, setContributionDays] = useState<{ level: number, date: Date }[]>([]);

    useEffect(() => {
        const days = Array.from({ length: 371 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (370 - i));
            return {
                level: isAddyDemo ? Math.floor(Math.random() * 5) : (userAgents.length > 0 ? Math.floor(Math.random() * 3) : 0),
                date
            };
        });
        setContributionDays(days);
    }, [isAddyDemo, userAgents.length]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <div className="container mx-auto px-4 py-10">
            <div className="flex flex-col lg:flex-row gap-8">
                <aside className="w-full lg:w-72 space-y-6 shrink-0">
                    <div className="space-y-4">
                        <Avatar className="h-64 w-64 border-2 border-muted-foreground/10 rounded-2xl mx-auto lg:mx-0 flex items-center justify-center bg-muted overflow-hidden">
                            <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                            <AvatarFallback className="bg-primary/20 text-primary font-bold text-4xl">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-headline font-bold">{user.name}</h1>
                            <p className="text-muted-foreground text-lg">@{user.username}</p>
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {user.bio || "No bio provided yet."}
                        </p>
                        {isSelf ? (
                            <Button
                                onClick={handleOpenEditModal}
                                variant="outline"
                                className="w-full h-9 rounded-xl font-medium gap-2 border-primary/30 hover:bg-primary/10 hover:text-primary transition-all"
                            >
                                <Edit3 className="h-4 w-4" />
                                Edit profile
                            </Button>
                        ) : (
                            <Button
                                onClick={handleFollowToggle}
                                variant={isUserFollowed ? "outline" : "default"}
                                className={`w-full h-9 rounded-xl font-medium gap-2 transition-all ${
                                    isUserFollowed 
                                    ? "border-muted-foreground/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-foreground" 
                                    : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                                }`}
                            >
                                {isUserFollowed ? (
                                    <>
                                        <UserCheck className="h-4 w-4 text-emerald-500" />
                                        Following
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-4 w-4" />
                                        Follow
                                    </>
                                )}
                            </Button>
                        )}

                        <div className="flex items-center gap-4 text-sm font-medium pt-1">
                            <button
                                onClick={() => setDialogMode('followers')}
                                className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer group"
                            >
                                <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                <span className="font-bold">{user.followers}</span>
                                <span className="text-muted-foreground font-normal">followers</span>
                            </button>
                            <button
                                onClick={() => setDialogMode('following')}
                                className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer group"
                            >
                                <span className="font-bold">{user.following}</span>
                                <span className="text-muted-foreground font-normal">following</span>
                            </button>
                        </div>

                        {(user.location || user.website || user.twitter) && (
                            <div className="space-y-3 pt-2 text-sm text-muted-foreground">
                                {user.location && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        {user.location}
                                    </div>
                                )}
                                {user.website && (
                                    <div className="flex items-center gap-2">
                                        <LinkIcon className="h-4 w-4" />
                                        <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors">{user.website}</a>
                                    </div>
                                )}
                                {user.twitter && (
                                    <div className="flex items-center gap-2">
                                        <Twitter className="h-4 w-4" />
                                        <a href={`https://twitter.com/${user.twitter}`} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors">@{user.twitter}</a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </aside>

                <main className="flex-1 space-y-8">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-12 p-0 mb-6 gap-6 overflow-x-auto">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 gap-2">
                                <BookOpen className="h-4 w-4" />
                                Overview
                            </TabsTrigger>
                            <TabsTrigger value="repositories" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 gap-2">
                                <GitBranch className="h-4 w-4" />
                                Repositories
                                <span className="ml-1 bg-muted px-1.5 rounded-full text-[10px] font-bold">{userAgents.length}</span>
                            </TabsTrigger>
                            <TabsTrigger value="stars" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 gap-2">
                                <Star className="h-4 w-4" />
                                Stars
                                <span className="ml-1 bg-muted px-1.5 rounded-full text-[10px] font-bold">{totalStars}</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="mt-0 space-y-8">
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium">Pinned agents</h3>
                                    {userAgents.length > 0 && (
                                        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Customize pins</Button>
                                    )}
                                </div>
                                {pinnedAgents.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {pinnedAgents.map((agent) => (
                                            <AgentCard key={agent.id} agent={agent} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 px-4 text-center border border-dashed rounded-xl bg-muted/10 space-y-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                                            <GitBranch className="h-5 w-5" />
                                        </div>
                                        <h4 className="font-bold text-base">No agents published yet</h4>
                                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                            Create your first AI agent repository to showcase it on your profile and AgentSpace.
                                        </p>
                                        {isSelf && (
                                            <Link href="/create" className="inline-block pt-2">
                                                <Button size="sm" className="gap-2 rounded-xl bg-primary">
                                                    <Plus className="h-4 w-4" />
                                                    Create First Agent
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </section>

                            <section>
                                <h3 className="text-sm font-medium mb-4">Agent Contribution Graph</h3>
                                <Card className="bg-card/50 border-muted overflow-hidden">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col gap-2 overflow-x-auto pb-2">
                                            <div className="flex gap-2 min-w-max">
                                                <div className="flex flex-col justify-around text-[9px] text-muted-foreground pt-4 pb-1 pr-1">
                                                    <span className="h-2.5">Mon</span>
                                                    <span className="h-2.5">Wed</span>
                                                    <span className="h-2.5">Fri</span>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex text-[9px] text-muted-foreground justify-between w-full pr-4">
                                                        {months.map(m => <span key={m} className="w-full text-left">{m}</span>)}
                                                    </div>

                                                    <div className="grid grid-rows-7 grid-flow-col gap-1">
                                                        {contributionDays.map((day, i) => (
                                                            <div
                                                                key={i}
                                                                className={`h-2.5 w-2.5 rounded-sm shrink-0 transition-colors ${day.level === 0 ? 'bg-muted/40' :
                                                                        day.level === 1 ? 'bg-primary/20' :
                                                                            day.level === 2 ? 'bg-primary/40' :
                                                                                day.level === 3 ? 'bg-primary/60' :
                                                                                    'bg-primary'
                                                                    }`}
                                                                title={`${day.date.toDateString()}: ${day.level} contributions`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
                                            <div>Contribution Activity</div>
                                            <div className="flex items-center gap-1.5">
                                                Less
                                                <div className="h-2.5 w-2.5 bg-muted/40 rounded-sm" />
                                                <div className="h-2.5 w-2.5 bg-primary/20 rounded-sm" />
                                                <div className="h-2.5 w-2.5 bg-primary/40 rounded-sm" />
                                                <div className="h-2.5 w-2.5 bg-primary/60 rounded-sm" />
                                                <div className="h-2.5 w-2.5 bg-primary rounded-sm" />
                                                More
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </section>
                        </TabsContent>

                        <TabsContent value="repositories" className="mt-0">
                            <div className="space-y-4">
                                {userAgents.length > 0 ? (
                                    userAgents.map((agent) => (
                                        <Card key={agent.id} className="bg-transparent shadow-none border-b border-muted rounded-none last:border-0 hover:bg-muted/10 transition-colors">
                                            <div className="p-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <Link href={`/agent/${agent.id}`}>
                                                            <h4 className="font-headline font-bold text-lg text-primary hover:underline cursor-pointer">{agent.name}</h4>
                                                        </Link>
                                                        <p className="text-sm text-muted-foreground">{agent.description}</p>
                                                    </div>
                                                    <Badge variant="outline" className="text-[10px] uppercase">Public</Badge>
                                                </div>
                                                <div className="flex items-center gap-6 text-xs text-muted-foreground mt-4">
                                                    <div className="flex items-center gap-1">
                                                        <div className="h-3 w-3 rounded-full bg-primary" />
                                                        {agent.category || 'General'}
                                                    </div>
                                                    <div className="flex items-center gap-1 hover:text-primary cursor-pointer">
                                                        <Star className="h-3.5 w-3.5" />
                                                        {agent.stars || 0}
                                                    </div>
                                                    <div className="flex items-center gap-1 hover:text-primary cursor-pointer">
                                                        <GitBranch className="h-3.5 w-3.5" />
                                                        {agent.forks || 0}
                                                    </div>
                                                    <div>Updated {agent.updatedAt || 'Recently'}</div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="py-20 text-center border border-dashed rounded-xl bg-muted/10 space-y-3">
                                        <h3 className="text-lg font-headline font-bold mb-1">No repositories found</h3>
                                        <p className="text-muted-foreground text-xs max-w-sm mx-auto">
                                            This account hasn't created any agent repositories on AgentSpace yet.
                                        </p>
                                        {isSelf && (
                                            <Link href="/create" className="inline-block pt-2">
                                                <Button size="sm" className="gap-2 rounded-xl bg-primary">
                                                    <Plus className="h-4 w-4" />
                                                    Create Agent Repository
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="stars" className="mt-0 space-y-4">
                            {userAgents.filter(a => (a.stars || 0) > 0).length > 0 ? (
                                userAgents.filter(a => (a.stars || 0) > 0).map(agent => (
                                    <Card key={agent.id} className="bg-transparent shadow-none border-b border-muted rounded-none">
                                        <div className="p-4">
                                            <Link href={`/agent/${agent.id}`}>
                                                <h4 className="font-bold text-primary hover:underline">{agent.name}</h4>
                                            </Link>
                                            <p className="text-xs text-muted-foreground mt-1">{agent.description}</p>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <div className="py-16 text-center border border-dashed rounded-xl bg-muted/10">
                                    <Star className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                                    <h4 className="font-bold text-sm">No starred repositories</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Starred agents will appear here.</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </main>
            </div>

            {/* Followers / Following List Modal */}
            <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && setDialogMode(null)}>
                <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/80 rounded-2xl p-6 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-headline font-bold flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            {dialogMode === 'followers' ? `Followers (${followersList.length})` : `Following (${followingList.length})`}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-2 mt-4 max-h-80 overflow-y-auto pr-1">
                        {dialogMode === 'followers' && (
                            followersList.length > 0 ? (
                                followersList.map(follower => (
                                    <Link
                                        key={follower.username}
                                        href={`/profile/${follower.username}`}
                                        onClick={() => setDialogMode(null)}
                                        className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border border-primary/30">
                                                <AvatarImage src={follower.avatar} alt={follower.name} />
                                                <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                                                    {follower.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-bold group-hover:text-primary transition-colors">{follower.name}</p>
                                                <p className="text-xs text-muted-foreground">@{follower.username}</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                    </Link>
                                ))
                            ) : (
                                <div className="py-12 text-center space-y-2">
                                    <Users className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                                    <p className="text-sm font-bold">No followers yet</p>
                                    <p className="text-xs text-muted-foreground">Be the first to follow @{user.username}!</p>
                                </div>
                            )
                        )}

                        {dialogMode === 'following' && (
                            followingList.length > 0 ? (
                                followingList.map(item => (
                                    <Link
                                        key={item.username}
                                        href={`/profile/${item.username}`}
                                        onClick={() => setDialogMode(null)}
                                        className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border border-primary/30">
                                                <AvatarImage src={item.avatar} alt={item.name} />
                                                <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                                                    {item.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-bold group-hover:text-primary transition-colors">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">@{item.username}</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                    </Link>
                                ))
                            ) : (
                                <div className="py-12 text-center space-y-2">
                                    <Users className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                                    <p className="text-sm font-bold">Not following anyone yet</p>
                                    <p className="text-xs text-muted-foreground">Developers followed by @{user.username} will appear here.</p>
                                </div>
                            )
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Profile Dialog */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl border-border bg-background shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                            <Edit3 className="h-5 w-5 text-primary" />
                            Edit Public Profile
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Update your personal information displayed on your AgentSpace profile.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-name" className="text-xs font-bold">Full Name</Label>
                                <Input
                                    id="edit-name"
                                    value={editFullName}
                                    onChange={(e) => setEditFullName(e.target.value)}
                                    placeholder="Your full name"
                                    className="h-9 text-xs rounded-xl bg-background/50 border-border focus:border-primary"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-username" className="text-xs font-bold">Username</Label>
                                <Input
                                    id="edit-username"
                                    value={editUsername}
                                    onChange={(e) => setEditUsername(e.target.value)}
                                    placeholder="username"
                                    className="h-9 text-xs rounded-xl bg-background/50 border-border focus:border-primary font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-bio" className="text-xs font-bold">Bio</Label>
                            <Textarea
                                id="edit-bio"
                                value={editBio}
                                onChange={(e) => setEditBio(e.target.value)}
                                placeholder="Tell the community about yourself and what you build..."
                                className="min-h-[80px] text-xs rounded-xl bg-background/50 border-border focus:border-primary"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-location" className="text-xs font-bold">Location</Label>
                                <Input
                                    id="edit-location"
                                    value={editLocation}
                                    onChange={(e) => setEditLocation(e.target.value)}
                                    placeholder="San Francisco, CA"
                                    className="h-9 text-xs rounded-xl bg-background/50 border-border focus:border-primary"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-twitter" className="text-xs font-bold">Twitter / X Handle</Label>
                                <Input
                                    id="edit-twitter"
                                    value={editTwitter}
                                    onChange={(e) => setEditTwitter(e.target.value)}
                                    placeholder="handle"
                                    className="h-9 text-xs rounded-xl bg-background/50 border-border focus:border-primary"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-website" className="text-xs font-bold">Website URL</Label>
                            <Input
                                id="edit-website"
                                value={editWebsite}
                                onChange={(e) => setEditWebsite(e.target.value)}
                                placeholder="https://yourportfolio.com"
                                className="h-9 text-xs rounded-xl bg-background/50 border-border focus:border-primary"
                            />
                        </div>

                        {/* Select Avatar Preset */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold flex items-center justify-between">
                                <span>Choose Avatar</span>
                                <span className="text-[10px] font-normal text-muted-foreground">Select one of 6 preset avatars</span>
                            </Label>
                            <div className="grid grid-cols-6 gap-2">
                                {[
                                    { id: 'avatar-1', name: 'Coder', url: '/avatars/avatar-1.png' },
                                    { id: 'avatar-2', name: 'Night', url: '/avatars/avatar-2.png' },
                                    { id: 'avatar-3', name: 'Sunset', url: '/avatars/avatar-3.png' },
                                    { id: 'avatar-4', name: 'Cozy', url: '/avatars/avatar-4.png' },
                                    { id: 'avatar-5', name: 'Star', url: '/avatars/avatar-5.png' },
                                    { id: 'avatar-6', name: 'Cap', url: '/avatars/avatar-6.png' },
                                ].map((preset) => {
                                    const isSelected = editAvatarUrl === preset.url;
                                    return (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => setEditAvatarUrl(preset.url)}
                                            className={`relative flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all cursor-pointer group ${
                                                isSelected
                                                    ? 'border-primary bg-primary/10 ring-2 ring-primary/30 scale-105'
                                                    : 'border-border/80 hover:border-primary/50 hover:bg-muted/30'
                                            }`}
                                        >
                                            <Avatar className="h-10 w-10 rounded-lg overflow-hidden">
                                                <AvatarImage src={preset.url} alt={preset.name} className="object-cover" />
                                                <AvatarFallback className="text-[10px] font-bold bg-primary/20 text-primary">
                                                    {preset.name[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-[9px] font-medium mt-1 truncate w-full text-center text-muted-foreground group-hover:text-foreground">
                                                {preset.name}
                                            </span>
                                            {isSelected && (
                                                <CheckCircle2 className="h-4 w-4 text-primary absolute -top-1 -right-1 bg-background rounded-full border border-primary/20" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <DialogFooter className="pt-3 gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsEditModalOpen(false)}
                                className="h-9 rounded-xl text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSavingProfile}
                                className="h-9 rounded-xl text-xs bg-primary hover:bg-primary/90 gap-2 font-semibold shadow-md"
                            >
                                {isSavingProfile ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
