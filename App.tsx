
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Leaderboard } from './components/Leaderboard';
import { RaceHistory } from './components/RaceHistory';
import { AthleteManager } from './components/AthleteManager';
import { TrendsAnalysis } from './components/TrendsAnalysis';
import { RecordsList } from './components/RecordsList';
import { Editor } from './components/Editor';
import { AICoach } from './components/AICoach';
import { useAthleticsData } from './hooks/useAthleticsData';
import { Tab } from './types';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { 
    athletes, 
    standards, 
    sessions,
    routes,
    addAthlete, 
    deleteAthlete, 
    toggleAthleteStatus,
    addStandard, 
    updateStandard,
    addRoute,
    deleteRoute,
    recordSession,
    deleteSession,
    importData
  } = useAthleticsData();

  const handleRecordSession = (meta: any, entries: any[]) => {
    recordSession(meta, entries);
    setCurrentTab('history');
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Leaderboard athletes={athletes} sessions={sessions} />;
      case 'records':
        return <RecordsList athletes={athletes} sessions={sessions} standards={standards} routes={routes} />;
      case 'trends':
        return <TrendsAnalysis athletes={athletes} sessions={sessions} />;
      case 'history':
        return (
          <RaceHistory 
            sessions={sessions} 
            athletes={athletes} 
            standards={standards} 
            onDelete={deleteSession} 
            isAdmin={isAuthenticated} 
          />
        );
      case 'athletes':
        return (
          <AthleteManager 
            athletes={athletes} 
            standards={standards} 
            sessions={sessions}
            onAdd={addAthlete} 
            onDelete={deleteAthlete}
            onToggleStatus={toggleAthleteStatus}
            isAdmin={isAuthenticated}
          />
        );
      case 'ai-coach':
        return (
          <AICoach 
            athletes={athletes}
            sessions={sessions}
            standards={standards}
          />
        );
      case 'editor':
        return (
          <Editor 
            athletes={athletes}
            standards={standards}
            routes={routes}
            sessions={sessions}
            onRecordSession={handleRecordSession}
            onAddRoute={addRoute}
            onDeleteRoute={deleteRoute}
            onUpdateStandard={updateStandard}
            onAddStandard={addStandard}
            onImportData={importData}
            isAuthenticated={isAuthenticated}
            onLogin={() => setIsAuthenticated(true)}
          />
        );
      default:
        return <Leaderboard athletes={athletes} sessions={sessions} />;
    }
  };

  return (
    <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
