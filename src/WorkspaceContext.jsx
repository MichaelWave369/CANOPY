import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';
import {createWorkspace,activeRevision,commitWorkspace,moveWorkspaceCursor,parseWorkspace,
 serializeWorkspace,selectWorkspaceRevision,STORAGE_KEY} from './workspace.js';

const WorkspaceContext=createContext(null);
function loadLocal(){
 if(typeof window==='undefined')return{workspace:createWorkspace(),message:'Local browser storage unavailable; using reference scenario.'};
 try{
  const saved=window.localStorage.getItem(STORAGE_KEY);
  return saved?{workspace:parseWorkspace(saved),message:'Restored local scenario history.'}:
   {workspace:createWorkspace(),message:'Canonical synthetic reference workspace loaded.'};
 }catch(e){
  return{workspace:createWorkspace(),message:'Saved workspace could not be read or validated. Loaded the canonical reference instead: '+e.message};
 }
}
export function WorkspaceProvider({children}){
 const initial=useMemo(loadLocal,[]);
 const [workspace,setWorkspace]=useState(initial.workspace);
 const [message,setMessage]=useState(initial.message);
 useEffect(()=>{
  if(typeof window==='undefined')return;
  try{
   window.localStorage.setItem(STORAGE_KEY,serializeWorkspace(workspace));
  }catch(e){
   setMessage('Browser storage could not save this revision: '+e.message+'. Use JSON export to keep a copy.');
  }
 },[workspace]);
 const snapshot=activeRevision(workspace).snapshot;
 const revision=activeRevision(workspace);
 const setEnergy=(values)=>setWorkspace(current=>{
  const prior=activeRevision(current).snapshot;
  return commitWorkspace(current,{...prior,energy:{...values}},'Energy assumptions changed');
 });
 const setWater=(values)=>setWorkspace(current=>{
  const prior=activeRevision(current).snapshot;
  return commitWorkspace(current,{...prior,water:{...values}},'Water assumptions changed');
 });
 const setDistrict=(id)=>setWorkspace(current=>{
  const prior=activeRevision(current).snapshot;
  return commitWorkspace(current,{...prior,districtId:id},'Selected district: '+id);
 });
 const setDistrictLayout=(id,layout)=>setWorkspace(current=>{
  const prior=activeRevision(current).snapshot;
  return commitWorkspace(current,{...prior,layouts:{...prior.layouts,[id]:layout}},'Changed '+id+' building layout');
 });
 const undo=()=>setWorkspace(current=>moveWorkspaceCursor(current,-1));
 const redo=()=>setWorkspace(current=>moveWorkspaceCursor(current,1));
 const goTo=index=>setWorkspace(current=>selectWorkspaceRevision(current,index));
 const reset=()=>{setWorkspace(createWorkspace());setMessage('Workspace reset to canonical concept reference.');};
 const importText=text=>{const next=parseWorkspace(text);setWorkspace(next);setMessage('Validated scenario history imported. No real-world approvals transferred.');};
 const value={workspace,revision,snapshot,message,setMessage,setEnergy,setWater,setDistrict,setDistrictLayout,undo,redo,reset,importText,
  goTo,canUndo:workspace.cursor>0,canRedo:workspace.cursor<workspace.history.length-1};
 return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
export function useWorkspace(){
 const value=useContext(WorkspaceContext);
 if(!value)throw new Error('CANOPY WorkspaceProvider is required');
 return value;
}
