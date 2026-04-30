/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Star, 
  Heart, 
  Music, 
  Disc, 
  User as UserIcon, 
  X, 
  LogOut,
  LogIn,
  Search,
  Home,
  Mail,
  Eye,
  EyeOff,
  Lock,
  Folder
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MUSICAL_STYLES, MOCK_MUSIC_ITEMS } from './constants';
import { MusicItem, UserRating, UserFavorite } from './types';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [filter1, setFilter1] = useState<'music' | 'album' | 'artist'>('music');
  const [filter2, setFilter2] = useState<'music' | 'album' | 'artist'>('music');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [ratings, setRatings] = useState<Record<string, { rating: number; comment?: string }>>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'all' | 'favorites' | 'rated'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [ratingModalItem, setRatingModalItem] = useState<MusicItem | null>(null);
  const [tempRating, setTempRating] = useState(0);
  const [tempComment, setTempComment] = useState('');

  // Reusable horizontal scroll hook logic
  const createScrollHandlers = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState(false);
    const [start, setStart] = useState(0);
    const [left, setLeft] = useState(0);

    const onMouseDown = (e: React.MouseEvent) => {
      if (!ref.current) return;
      setDragging(true);
      setStart(e.pageX - ref.current.offsetLeft);
      setLeft(ref.current.scrollLeft);
    };

    const onMouseLeave = () => setDragging(false);
    const onMouseUp = () => setDragging(false);

    const onMouseMove = (e: React.MouseEvent) => {
      if (!dragging || !ref.current) return;
      e.preventDefault();
      const x = e.pageX - ref.current.offsetLeft;
      const walk = (x - start) * 2;
      ref.current.scrollLeft = left - walk;
    };

    return { ref, dragging, onMouseDown, onMouseLeave, onMouseUp, onMouseMove };
  };

  const scrollSection1 = createScrollHandlers();
  const scrollSection2 = createScrollHandlers();

  // Load data from localStorage
  useEffect(() => {
    const savedRatings = localStorage.getItem('aaz_ratings');
    const savedFavorites = localStorage.getItem('aaz_favorites');
    const savedUser = localStorage.getItem('aaz_user');

    if (savedRatings) setRatings(JSON.parse(savedRatings));
    if (savedFavorites) setFavorites(new Set(JSON.parse(savedFavorites)));
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('aaz_ratings', JSON.stringify(ratings));
  }, [ratings]);

  useEffect(() => {
    localStorage.setItem('aaz_favorites', JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('aaz_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('aaz_user');
    }
  }, [user]);

  const getFilteredItems = (filter: 'music' | 'album' | 'artist') => {
    const filtered = MOCK_MUSIC_ITEMS.filter(item => {
      const matchesGenre = !selectedGenre || item.genre === selectedGenre;
      const matchesView = view === 'all' || 
                         (view === 'favorites' && favorites.has(item.id)) ||
                         (view === 'rated' && ratings[item.id]);
      
      const matchesType = (filter === 'music' && item.type === 'song') ||
                         (filter === 'album' && item.type === 'album') ||
                         (filter === 'artist' && item.type === 'artist');

      const matchesSearch = !searchQuery || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.album && item.album.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesGenre && matchesView && matchesType && matchesSearch;
    });

    return filtered.sort((a, b) => {
      if (filter === 'music') return a.title.localeCompare(b.title);
      if (filter === 'album') {
        const albumA = a.album || a.title;
        const albumB = b.album || b.title;
        return albumA.localeCompare(albumB);
      }
      if (filter === 'artist') return a.artist.localeCompare(b.artist);
      return 0;
    });
  };

  const filteredItems1 = useMemo(() => getFilteredItems(filter1), [selectedGenre, view, favorites, ratings, filter1, searchQuery]);
  const filteredItems2 = useMemo(() => getFilteredItems(filter2), [selectedGenre, view, favorites, ratings, filter2, searchQuery]);

  const openRatingModal = (item: MusicItem) => {
    if (!user) {
      alert('Por favor, faça login para avaliar.');
      return;
    }
    setRatingModalItem(item);
    setTempRating(ratings[item.id]?.rating || 0);
    setTempComment(ratings[item.id]?.comment || '');
  };

  const handleSaveRating = () => {
    if (ratingModalItem) {
      setRatings(prev => ({ 
        ...prev, 
        [ratingModalItem.id]: { rating: tempRating, comment: tempComment } 
      }));
      setRatingModalItem(null);
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLogin = () => {
    if (loginEmail || loginPassword) {
      setUser({ name: loginEmail || 'Usuário Demo', email: loginEmail || 'demo@example.com' });
    } else {
      setUser({ name: 'Usuário Demo', email: 'demo@example.com' });
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-100 rounded-full blur-[120px] opacity-60 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-50 rounded-full blur-[120px] opacity-60 animate-pulse" style={{ animationDelay: '1s' }} />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-[400px] relative z-10"
        >
          <div className="bg-white/70 backdrop-blur-2xl border border-white/50 rounded-[40px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] p-8 sm:p-12 flex flex-col items-center">
            {/* Custom Folder Icon - Refined */}
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative mb-10"
            >
              <div className="absolute -top-3 left-1 w-10 h-5 bg-[#009ee3] rounded-t-xl" />
              <div className="w-28 h-20 bg-gradient-to-br from-[#009ee3] to-[#0089c4] rounded-2xl rounded-tl-none relative flex items-center justify-center shadow-[0_12px_24px_-8px_rgba(0,158,227,0.5)] overflow-hidden">
                <Music size={40} className="text-white drop-shadow-md" fill="currentColor" />
                {/* Visual Depth Elements */}
                <div className="absolute top-0 inset-x-0 h-[1px] bg-white/30" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-10"
            >
              <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Entrar no AaZ</h1>
              <p className="text-gray-500 text-sm font-medium">Sua jornada musical começa aqui</p>
            </motion.div>

            <div className="w-full space-y-4">
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="relative group"
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#009ee3] transition-colors">
                  <Mail size={18} />
                </div>
                <input 
                  type="text" 
                  placeholder="E-mail ou Usuário"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-white border border-gray-100 px-11 py-3.5 text-sm focus:border-[#009ee3] focus:ring-4 focus:ring-[#009ee3]/10 focus:outline-none transition-all rounded-2xl placeholder:text-gray-300 shadow-sm"
                />
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="relative group"
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#009ee3] transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Senha"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-white border border-gray-100 px-11 py-3.5 text-sm focus:border-[#009ee3] focus:ring-4 focus:ring-[#009ee3]/10 focus:outline-none transition-all rounded-2xl placeholder:text-gray-300 pr-12 shadow-sm"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="pt-2 hover:translate-y-[-2px] transition-transform duration-300"
              >
                <button 
                  onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-[#009ee3] to-[#0089c4] text-white py-4 rounded-2xl font-bold text-sm hover:shadow-[0_8px_20px_-4px_rgba(0,158,227,0.4)] transition-all active:scale-[0.98] shadow-md tracking-wide"
                >
                  Entrar
                </button>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="w-full flex items-center gap-4 my-8"
            >
              <div className="h-[1px] flex-1 bg-gray-100" />
              <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Ou</span>
              <div className="h-[1px] flex-1 bg-gray-100" />
            </motion.div>

            <motion.button 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              onClick={handleLogin}
              className="w-full border border-gray-100 py-3.5 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-200 transition-all text-gray-600 text-sm font-semibold shadow-sm bg-white active:scale-[0.98]"
            >
              <svg width="20" height="20" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71a4.821 4.821 0 0 1 0-3.42V4.958H.957a8.991 8.991 0 0 0 0 8.084l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continuar com o Google
            </motion.button>
          </div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center mt-10 text-gray-400 text-xs"
          >
            Ainda não tem conta? <span className="text-[#009ee3] font-bold cursor-pointer hover:underline">Cadastre-se grátis</span>
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white text-gray-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-gray-200 bg-gray-50 flex flex-col"
          >
            <div className="p-8 flex items-center justify-between">
              <div className="group cursor-pointer">
                <h1 className="text-3xl font-black tracking-tighter italic text-sky-600 group-hover:scale-105 transition-transform duration-300 select-none">
                  AaZ<span className="text-sky-400">.</span>
                </h1>
                <div className="h-1 w-0 group-hover:w-full bg-sky-500 transition-all duration-500 rounded-full" />
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)} 
                className="lg:hidden w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-sky-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 space-y-8 pb-8 no-scrollbar">
              <div>
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 px-3">Navegação Principal</h2>
                <nav className="space-y-1.5">
                  <button 
                    onClick={() => setView('all')}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300",
                      view === 'all' ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20" : "text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-100"
                    )}
                  >
                    <Home size={18} />
                    <span className="font-semibold">Início</span>
                  </button>
                  <button 
                    onClick={() => setView('favorites')}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300",
                      view === 'favorites' ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20" : "text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-100"
                    )}
                  >
                    <Heart size={18} />
                    <span className="font-semibold">Minha Coleção</span>
                  </button>
                  <button 
                    onClick={() => setView('rated')}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300",
                      view === 'rated' ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20" : "text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-100"
                    )}
                  >
                    <Star size={18} />
                    <span className="font-semibold">Avaliações</span>
                  </button>
                </nav>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4 px-3">
                  <Disc size={14} className="text-sky-500" />
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Explorar Gêneros</h2>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {MUSICAL_STYLES.map(style => (
                    <button
                      key={style}
                      onClick={() => setSelectedGenre(selectedGenre === style ? null : style)}
                      className={cn(
                        "text-left px-4 py-2 rounded-xl text-sm transition-all duration-200 border border-transparent",
                        selectedGenre === style 
                          ? "bg-white text-sky-600 border-sky-100 shadow-sm font-bold" 
                          : "text-gray-500 hover:text-gray-900 hover:bg-white hover:border-gray-100"
                      )}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-white/50 backdrop-blur-md">
              {user ? (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white shadow-inner">
                    <UserIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{user.name}</p>
                    <button onClick={handleLogout} className="text-[10px] font-bold text-sky-500 hover:text-sky-700 uppercase tracking-widest transition-colors flex items-center gap-1">
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="w-full flex items-center justify-center gap-2 bg-sky-500 text-white py-3 rounded-2xl font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20 active:scale-95"
                >
                  <LogIn size={18} />
                  Entrar no AaZ
                </button>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Header */}
        <header className="h-20 border-b border-gray-100 flex items-center px-6 relative z-30 bg-white/80 backdrop-blur-xl">
          <div className="flex items-center gap-4 w-full">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-sky-600 hover:border-sky-200 transition-all shadow-sm"
              >
                <UserIcon size={18} />
              </button>
            )}
            
            <div className="flex-1 max-w-md relative group">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar por música, artista ou álbum..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50/50 border border-transparent focus:border-sky-200 focus:bg-white px-10 py-2.5 rounded-2xl text-sm transition-all focus:ring-4 focus:ring-sky-500/10 placeholder:text-gray-400"
              />
            </div>

            <div className="hidden sm:block ml-auto pointer-events-auto group">
              <h1 className="text-3xl font-black tracking-tighter italic text-sky-600 drop-shadow-sm select-none group-hover:scale-105 transition-transform duration-300">
                AaZ<span className="text-sky-400">.</span>
              </h1>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pl-3 pr-6 py-6 no-scrollbar relative">
          {view === 'favorites' ? (
            <div className="absolute inset-0 bg-gradient-to-b from-sky-50/30 to-transparent pointer-events-none" />
          ) : view === 'all' ? (
            <div className="absolute inset-0 bg-gradient-to-br from-sky-50/20 via-transparent to-transparent pointer-events-none" />
          ) : null}
          <div className="max-w-7xl mx-auto relative z-10">
            {view === 'all' && (
              <div className="mb-10 px-2 mt-4">
                <p className="text-sky-600 font-bold text-xs uppercase tracking-[0.3em] mb-2">Boa música, {user?.name.split(' ')[0]}!</p>
                <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tighter leading-none">
                  O que vamos ouvir <span className="text-sky-500">hoje?</span>
                </h1>
              </div>
            )}
            <div className={cn(
              "flex flex-wrap items-center justify-between gap-4 mb-8 px-2",
              view === 'favorites' && "mb-12"
            )}>
              <div className="flex flex-col gap-1">
                {view === 'favorites' && (
                  <span className="text-[10px] sm:text-xs font-bold text-sky-500 uppercase tracking-[0.2em] mb-1">
                    Minha Coleção
                  </span>
                )}
                <h2 className="text-lg sm:text-3xl font-black tracking-tight text-gray-900 flex items-center gap-2 whitespace-nowrap">
                  {view === 'all' ? (
                    <span className="flex items-center gap-1.5">
                      5 <Star size={20} className="text-sky-500 sm:w-6 sm:h-6" fill="currentColor" /> do dia
                    </span>
                  ) : (view === 'favorites' ? (
                    <>
                      <Heart size={24} className="text-sky-500 sm:w-7 sm:h-7" fill="currentColor" />
                      Minhas Curtidas
                    </>
                  ) : 'Minhas Avaliações')}
                </h2>
                {view === 'favorites' && favorites.size > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Sua biblioteca pessoal com {favorites.size} {favorites.size === 1 ? 'item' : 'itens'} selecionados.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-gray-50 p-0.5 rounded-md border border-gray-100">
                  <button 
                    onClick={() => setFilter1('music')}
                    className={cn(
                      "px-3 py-1 rounded text-sm font-medium transition-all",
                      filter1 === 'music' ? "bg-white text-sky-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    Música
                  </button>
                  <button 
                    onClick={() => setFilter1('album')}
                    className={cn(
                      "px-3 py-1 rounded text-sm font-medium transition-all",
                      filter1 === 'album' ? "bg-white text-sky-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    Álbum
                  </button>
                  <button 
                    onClick={() => setFilter1('artist')}
                    className={cn(
                      "px-3 py-1 rounded text-sm font-medium transition-all",
                      filter1 === 'artist' ? "bg-white text-sky-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    Artista
                  </button>
                </div>
              </div>
            </div>

            <div 
              ref={scrollSection1.ref}
              onMouseDown={scrollSection1.onMouseDown}
              onMouseLeave={scrollSection1.onMouseLeave}
              onMouseUp={scrollSection1.onMouseUp}
              onMouseMove={scrollSection1.onMouseMove}
              className={cn(
                "flex overflow-x-auto gap-4 sm:gap-6 pb-8 no-scrollbar -mx-6 pl-64 pr-6 select-none",
                scrollSection1.dragging ? "cursor-grabbing" : "cursor-grab",
                !scrollSection1.dragging && "snap-x snap-mandatory"
              )}
            >
              {filteredItems1.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="snap-start shrink-0 w-[160px] sm:w-[220px] group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-sky-300 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <div className="aspect-square relative overflow-hidden bg-gray-100 group-hover:shadow-lg transition-all duration-500">
                    <img 
                      src={item.coverUrl} 
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <Music size={24} fill="currentColor" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 z-10 transition-transform active:scale-95">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                        className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all bg-white/80 backdrop-blur-md border border-white/50 shadow-sm hover:scale-110"
                        title={favorites.has(item.id) ? "Descurtir" : "Curtir"}
                      >
                        <Heart 
                          size={14} 
                          className={cn(
                            "sm:w-5 sm:h-5 transition-colors",
                            favorites.has(item.id) ? "text-sky-500" : "text-gray-400"
                          )} 
                          fill={favorites.has(item.id) ? "currentColor" : "none"} 
                        />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4">
                    <div className="mb-2 sm:mb-3">
                      <h3 className="font-bold text-xs sm:text-base leading-tight truncate text-gray-900 mb-0.5 sm:mb-1">{item.title}</h3>
                      <p className="text-gray-500 text-[9px] sm:text-xs truncate">
                        {item.artist} {item.album && item.album !== item.title && `• ${item.album}`}
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-2 sm:gap-4">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => openRatingModal(item)}
                          className="flex items-center gap-0.5 sm:gap-1 group/star bg-gray-50/50 px-2 py-1 rounded-lg hover:bg-sky-50 transition-colors"
                        >
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star 
                              key={star}
                              size={10} 
                              className={cn(
                                "sm:w-3 sm:h-3 transition-all duration-300",
                                (ratings[item.id]?.rating || 0) >= star ? "text-sky-500 scale-110" : "text-gray-200 group-hover/star:text-sky-200"
                              )}
                              fill={(ratings[item.id]?.rating || 0) >= star ? "currentColor" : "none"} 
                            />
                          ))}
                          <span className="text-[8px] sm:text-[10px] text-gray-500 ml-1.5 font-bold uppercase tracking-tighter">
                            {ratings[item.id] ? `${ratings[item.id].rating}/5` : 'Avaliar'}
                          </span>
                        </button>
                        <span className="text-[8px] sm:text-[9px] font-black text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          {item.genre}
                        </span>
                      </div>
                      
                      {ratings[item.id]?.comment ? (
                        <p className="text-[9px] sm:text-xs text-gray-500 italic line-clamp-2 bg-gray-50 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-gray-100">
                          "{ratings[item.id].comment}"
                        </p>
                      ) : (
                        <div className="h-[30px] sm:h-[42px] flex items-center justify-center border border-dashed border-gray-200 rounded-lg sm:rounded-xl">
                          <span className="text-[8px] sm:text-[10px] text-gray-300 uppercase tracking-widest">Sem comentário</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {view !== 'favorites' && (
              <>
                <div className="mt-12 mb-8">
                  <div className="flex items-center gap-6">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                      Para você
                    </h2>
                    <div className="flex items-center gap-1 bg-gray-50 p-0.5 rounded-md border border-gray-100">
                      <button 
                        onClick={() => setFilter2('music')}
                        className={cn(
                          "px-3 py-1 rounded text-sm font-medium transition-all",
                          filter2 === 'music' ? "bg-white text-sky-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        Música
                      </button>
                      <button 
                        onClick={() => setFilter2('album')}
                        className={cn(
                          "px-3 py-1 rounded text-sm font-medium transition-all",
                          filter2 === 'album' ? "bg-white text-sky-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        Álbum
                      </button>
                      <button 
                        onClick={() => setFilter2('artist')}
                        className={cn(
                          "px-3 py-1 rounded text-sm font-medium transition-all",
                          filter2 === 'artist' ? "bg-white text-sky-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        Artista
                      </button>
                    </div>
                  </div>
                </div>

                <div 
                  ref={scrollSection2.ref}
                  onMouseDown={scrollSection2.onMouseDown}
                  onMouseLeave={scrollSection2.onMouseLeave}
                  onMouseUp={scrollSection2.onMouseUp}
                  onMouseMove={scrollSection2.onMouseMove}
                  className={cn(
                    "flex overflow-x-auto gap-4 sm:gap-6 pb-20 no-scrollbar -mx-6 pl-64 pr-6 select-none",
                    scrollSection2.dragging ? "cursor-grabbing" : "cursor-grab",
                    !scrollSection2.dragging && "snap-x snap-mandatory"
                  )}
                >
                  {filteredItems2.map((item, index) => (
                    <motion.div
                      key={`${item.id}-grid`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (index % 10) * 0.05 }}
                      className="snap-start shrink-0 w-[160px] sm:w-[220px] group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-sky-300 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <div className="aspect-square relative overflow-hidden bg-gray-100 group-hover:shadow-lg transition-all duration-500">
                        <img 
                          src={item.coverUrl} 
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <Music size={24} fill="currentColor" />
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 z-10 transition-transform active:scale-95">
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                            className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all bg-white/80 backdrop-blur-md border border-white/50 shadow-sm hover:scale-110"
                            title={favorites.has(item.id) ? "Descurtir" : "Curtir"}
                          >
                            <Heart 
                              size={14} 
                              className={cn(
                                "sm:w-5 sm:h-5 transition-colors",
                                favorites.has(item.id) ? "text-sky-500" : "text-gray-400"
                              )} 
                              fill={favorites.has(item.id) ? "currentColor" : "none"} 
                            />
                          </button>
                        </div>
                      </div>

                      <div className="p-3 sm:p-4">
                        <div className="mb-2 sm:mb-3">
                          <h3 className="font-bold text-gray-900 text-xs sm:text-sm truncate group-hover:text-sky-600 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-[10px] sm:text-xs text-gray-500 truncate">{item.artist}</p>
                          {item.type === 'song' && item.album && (
                            <p className="text-[8px] sm:text-[10px] text-gray-400 truncate flex items-center gap-1 mt-1 font-medium">
                              <Disc size={10} className="sm:w-3 sm:h-3" />
                              {item.album}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 sm:gap-4">
                          <div className="flex items-center justify-between">
                            <button 
                              onClick={() => openRatingModal(item)}
                              className="flex items-center gap-0.5 sm:gap-1 group/star bg-gray-50/50 px-2 py-1 rounded-lg hover:bg-sky-50 transition-colors"
                            >
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star 
                                  key={star}
                                  size={10} 
                                  className={cn(
                                    "sm:w-3 sm:h-3 transition-all duration-300",
                                    (ratings[item.id]?.rating || 0) >= star ? "text-sky-500 scale-110" : "text-gray-200 group-hover/star:text-sky-200"
                                  )}
                                  fill={(ratings[item.id]?.rating || 0) >= star ? "currentColor" : "none"} 
                                />
                              ))}
                              <span className="text-[8px] sm:text-[10px] text-gray-500 ml-1.5 font-bold uppercase tracking-tighter">
                                {ratings[item.id] ? `${ratings[item.id].rating}/5` : 'Avaliar'}
                              </span>
                            </button>
                            <span className="text-[8px] sm:text-[9px] font-black text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              {item.genre}
                            </span>
                          </div>
                          
                          {ratings[item.id]?.comment ? (
                            <p className="text-[9px] sm:text-xs text-gray-500 italic line-clamp-2 bg-gray-50 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-gray-100">
                              "{ratings[item.id].comment}"
                            </p>
                          ) : (
                            <div className="h-[30px] sm:h-[42px] flex items-center justify-center border border-dashed border-gray-200 rounded-lg sm:rounded-xl">
                              <span className="text-[8px] sm:text-[10px] text-gray-300 uppercase tracking-widest">Sem comentário</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {((view === 'favorites' && filteredItems1.length === 0) || 
             (view !== 'favorites' && filteredItems1.length === 0 && filteredItems2.length === 0)) && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-sky-50 flex items-center justify-center mb-8 relative group">
                  <div className="absolute inset-0 rounded-full bg-sky-100 animate-ping opacity-20 group-hover:hidden" />
                  {view === 'favorites' ? (
                    <Heart size={48} className="text-sky-200 group-hover:scale-110 transition-transform" />
                  ) : (
                    <Disc size={48} className="text-sky-200 animate-spin-slow" />
                  )}
                </div>
                <h3 className="text-2xl font-black text-gray-900">
                  {view === 'favorites' ? 'Sua biblioteca está vazia' : 'Nenhum resultado encontrado'}
                </h3>
                <p className="text-gray-400 max-w-xs mt-3 leading-relaxed">
                  {view === 'favorites' 
                    ? 'Explore novas músicas e clique no coração azul para salvá-las em sua coleção pessoal.' 
                    : 'Tente ajustar seus filtros ou pesquisar por algo diferente.'}
                </p>
                {view === 'favorites' && (
                  <button 
                    onClick={() => setView('all')}
                    className="mt-8 px-6 py-2.5 bg-sky-500 text-white font-bold rounded-full hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20 active:scale-95"
                  >
                    Explorar músicas
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        <nav className="h-14 bg-white/90 backdrop-blur-xl flex items-center justify-around px-8 border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] shrink-0">
          <button 
            onClick={() => setView('all')}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300",
              view === 'all' ? "text-sky-500 scale-110" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Home size={22} fill={view === 'all' ? "currentColor" : "none"} strokeWidth={view === 'all' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Home</span>
          </button>
          <button 
            onClick={() => setView('favorites')}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300",
              view === 'favorites' ? "text-sky-500 scale-110" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Heart size={22} fill={view === 'favorites' ? "currentColor" : "none"} strokeWidth={view === 'favorites' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Biblioteca</span>
          </button>
          <button 
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-all"
          >
            <Mail size={22} />
            <span className="text-[10px] font-bold">Inbox</span>
          </button>
        </nav>
      </main>

      {/* Rating Modal */}
      <AnimatePresence>
        {ratingModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRatingModalItem(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-[32px] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex gap-4">
                    <div className="relative group">
                      <img 
                        src={ratingModalItem.coverUrl} 
                        alt={ratingModalItem.title}
                        className="w-24 h-24 rounded-2xl object-cover shadow-2xl transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 rounded-2xl shadow-inner pointer-events-none" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">{ratingModalItem.title}</h3>
                      <p className="text-sky-600 font-bold text-sm tracking-wide mt-1">{ratingModalItem.artist}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setRatingModalItem(null)} 
                    className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all border border-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="bg-gray-50/50 p-6 rounded-[24px] border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">O que você achou?</p>
                    <div className="flex justify-center gap-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setTempRating(star)}
                          className="transition-all duration-300 hover:scale-125 active:scale-90"
                        >
                          <Star 
                            size={36} 
                            className={cn(
                              "transition-all duration-300",
                              tempRating >= star ? "text-sky-500 drop-shadow-[0_0_8px_rgba(14,165,233,0.4)]" : "text-gray-200"
                            )} 
                            fill={tempRating >= star ? "currentColor" : "none"} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Seu Comentário</label>
                    <textarea 
                      value={tempComment}
                      onChange={(e) => setTempComment(e.target.value)}
                      placeholder="Conte para nós o que sentiu ouvindo..."
                      className="w-full bg-gray-50 border border-transparent focus:border-sky-200 focus:bg-white rounded-2xl p-4 text-sm min-h-[120px] transition-all focus:ring-4 focus:ring-sky-500/10 placeholder:text-gray-300 resize-none font-medium"
                    />
                  </div>

                  <button 
                    onClick={handleSaveRating}
                    disabled={tempRating === 0}
                    className="w-full bg-sky-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-sky-600 transition-all shadow-xl shadow-sky-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Salvar Avaliação
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
