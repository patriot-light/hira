import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Menu, Bell, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';

const Header = ({ onMenuClick }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isRTL } = useLanguage();

  return (
    <header className={cn(
      "fixed top-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-border z-30 flex items-center justify-between px-4 md:px-6",
      isRTL() ? "left-0 md:right-64" : "left-0 md:left-64"
    )}>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          data-testid="menu-toggle-btn"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="hidden md:flex items-center gap-2 bg-muted rounded-xl px-3 py-1.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('search')}
            className="border-0 bg-transparent h-8 w-64 focus-visible:ring-0"
            data-testid="search-input"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="notifications-btn"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </Button>

        <div className="hidden md:flex items-center gap-2 ps-3 border-s border-border">
          <span className="text-sm text-muted-foreground">{t('welcomeBack')},</span>
          <span className="text-sm font-medium">{user?.full_name}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
