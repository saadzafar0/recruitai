import React, { createContext, useContext, useState } from 'react';

export type TaskStatus = 'not_started' | 'in_progress' | 'completed';

interface CandidateContextType {
  voiceStatus: TaskStatus;
  codingStatus: TaskStatus;
  designStatus: TaskStatus;
  setVoiceStatus: (s: TaskStatus) => void;
  setCodingStatus: (s: TaskStatus) => void;
  setDesignStatus: (s: TaskStatus) => void;
  micAvailable: boolean;
  setMicAvailable: (v: boolean) => void;
}

const CandidateContext = createContext<CandidateContextType>({
  voiceStatus: 'not_started',
  codingStatus: 'not_started',
  designStatus: 'not_started',
  setVoiceStatus: () => {},
  setCodingStatus: () => {},
  setDesignStatus: () => {},
  micAvailable: true,
  setMicAvailable: () => {},
});

export function CandidateProvider({ children }: { children: React.ReactNode }) {
  const [voiceStatus, setVoiceStatus] = useState<TaskStatus>('not_started');
  const [codingStatus, setCodingStatus] = useState<TaskStatus>('not_started');
  const [designStatus, setDesignStatus] = useState<TaskStatus>('not_started');
  const [micAvailable, setMicAvailable] = useState(true);

  return (
    <CandidateContext.Provider
      value={{
        voiceStatus, codingStatus, designStatus,
        setVoiceStatus, setCodingStatus, setDesignStatus,
        micAvailable, setMicAvailable,
      }}
    >
      {children}
    </CandidateContext.Provider>
  );
}

export function useCandidateContext() {
  return useContext(CandidateContext);
}
