'use client'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface League {
  id: string;
  name: string;
  imageUrl: string;
  gameVersion: "path-of-exile-1" | "path-of-exile-2";
  description?: string;
}

export default function ManageLeagues() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGameVersion, setSelectedGameVersion] = useState<string>("All Versions");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      const { data, error } = await supabase
        .from('leagues')
        .select('*');

      if (error) throw error;
      setLeagues(data || []);
    } catch (error) {
      console.error('Error fetching leagues:', error);
      toast.error('Failed to fetch leagues');
    } finally {
      setLoading(false);
    }
  };

  const filterLeagues = (leagues: League[]): League[] => {
    return leagues.filter(league => {
      const gameVersionMatch = selectedGameVersion === "All Versions" || league.gameVersion === selectedGameVersion;
      return gameVersionMatch;
    });
  };

  const filteredLeagues = filterLeagues(leagues);

  const handleDeleteLeague = async (leagueId: string) => {
    if (!confirm('Are you sure you want to delete this league?')) return;

    try {
      const { error } = await supabase
        .from('leagues')
        .delete()
        .eq('id', leagueId);

      if (error) throw error;
      
      setLeagues(leagues.filter(league => league.id !== leagueId));
      toast.success('League deleted successfully');
    } catch (error) {
      console.error('Error deleting league:', error);
      toast.error('Failed to delete league');
    }
  };

  const handleClearFilters = () => {
    setSelectedGameVersion("All Versions");
  };

  if (loading) {
    return (
      <main className="container h-min-screen pt-20">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container h-min-screen pt-20">
      <div className="max-w-4xl mx-auto p-6 rounded-lg shadow-md bg-black border border-gray-400/20">
        <h1 className="text-2xl font-bold text-gray-slate-100 mb-6">Manage Leagues</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Select
            value={selectedGameVersion}
            onValueChange={setSelectedGameVersion}
          >
            <SelectTrigger>
              <SelectValue placeholder="Game Version" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Versions">All Versions</SelectItem>
              <SelectItem value="path-of-exile-1">Path of Exile 1</SelectItem>
              <SelectItem value="path-of-exile-2">Path of Exile 2</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex justify-end">
            <Button 
              onClick={handleClearFilters}
              className="bg-slate-200 hover:bg-slate-300 font-bold"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        <div className="rounded-md border border-gray-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Game Version</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeagues.map((league) => (
                <TableRow key={league.id}>
                  <TableCell className="font-medium">{league.name}</TableCell>
                  <TableCell>{league.gameVersion}</TableCell>
                  <TableCell>{league.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteLeague(league.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  );
} 