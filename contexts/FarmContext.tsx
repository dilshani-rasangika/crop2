import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface Farm {
  id: string;
  user_id: string;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  area_size: number;
  soil_type: string;
  created_at: string;
}

interface FarmContextType {
  farms: Farm[];
  selectedFarm: Farm | null;
  loading: boolean;
  setSelectedFarm: (farm: Farm | null) => void;
  refreshFarms: () => Promise<void>;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshFarms = async () => {
    if (!session?.user.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFarms(data || []);

      if (data && data.length > 0 && !selectedFarm) {
        setSelectedFarm(data[0]);
      } else if (selectedFarm) {
        const updatedFarm = data?.find(f => f.id === selectedFarm.id);
        if (updatedFarm) {
          setSelectedFarm(updatedFarm);
        } else {
          setSelectedFarm(data?.[0] || null);
        }
      }
    } catch (error) {
      console.error('Error loading farms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      refreshFarms();
    } else {
      setFarms([]);
      setSelectedFarm(null);
      setLoading(false);
    }
  }, [session]);

  return (
    <FarmContext.Provider
      value={{
        farms,
        selectedFarm,
        loading,
        setSelectedFarm,
        refreshFarms,
      }}>
      {children}
    </FarmContext.Provider>
  );
}

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (context === undefined) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};
