import React from 'react';
import {STORAGE_KEY,PREVIOUS_STORAGE_KEY} from './workspace.js';

/**
 * Prevent a broken planner widget from turning the entire CANOPY site white.
 * Render errors are shown with a safe, user-directed recovery path.
 */
export default class StartupBoundary extends React.Component{
 constructor(props){super(props);this.state={error:null};}
 static getDerivedStateFromError(error){return{error};}
 componentDidCatch(error,details){
  console.error('CANOPY render error:',error,details);
 }
 backup(){
  try{
   const data={kind:'CANOPY emergency local-storage backup',version:1,
    entries:Object.fromEntries([STORAGE_KEY,PREVIOUS_STORAGE_KEY].map(k=>[k,localStorage.getItem(k)]))};
   const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
   const a=document.createElement('a');a.href=url;a.download='CANOPY-emergency-workspace-backup.json';
   document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }catch(error){window.alert('Backup could not be downloaded: '+error.message);}
 }
 reset(){
  if(!window.confirm('Reset CANOPY local browser workspace history? Back up your saved scenario first.'))return;
  try{localStorage.removeItem(STORAGE_KEY);localStorage.removeItem(PREVIOUS_STORAGE_KEY);window.location.reload();}
  catch(error){window.alert('Could not reset browser workspace: '+error.message);}
 }
 render(){
  if(!this.state.error)return this.props.children;
  const container={fontFamily:'system-ui,sans-serif',minHeight:'100vh',background:'#0a2119',color:'#eef7e8',padding:'max(48px,9vh) max(20px,7vw)',boxSizing:'border-box'};
  const button={background:'#d0e2ba',color:'#173b2b',border:0,padding:'13px 17px',margin:'8px 8px 8px 0',cursor:'pointer',fontSize:13,fontWeight:700};
  return <main role="alert" style={container}>
    <div style={{maxWidth:740,margin:'auto'}}>
      <p style={{letterSpacing:'.15em',color:'#b4c99d'}}>CANOPY / STARTUP RECOVERY</p>
      <h1 style={{fontSize:'clamp(32px,5vw,56px)',fontWeight:500,lineHeight:1.1}}>A planning view encountered an error.</h1>
      <p style={{fontSize:16,lineHeight:1.8,color:'#cfdfd0'}}>The application stopped rendering, but the site is reachable. Your saved scenario has not been automatically deleted or modified by this error handler.</p>
      <details style={{margin:'20px 0',padding:18,border:'1px solid #54775d'}}>
        <summary style={{cursor:'pointer'}}>Technical error details</summary>
        <pre style={{overflowWrap:'anywhere',whiteSpace:'pre-wrap',fontSize:12}}>{String(this.state.error?.stack||this.state.error?.message||'Unknown render error')}</pre>
      </details>
      <button type="button" style={button} onClick={()=>window.location.reload()}>Reload CANOPY</button>
      <button type="button" style={button} onClick={()=>this.backup()}>Back up saved workspace</button>
      <button type="button" style={button} onClick={()=>this.reset()}>Reset local workspace and reload</button>
      <p style={{fontSize:12,color:'#b7cbb7',lineHeight:1.8}}>Reset is optional and removes this browser's saved CANOPY v1/v2 history. It does not affect GitHub repositories. Use the backup option first if you have planning changes.</p>
      <a href="https://github.com/MichaelWave369/CANOPY/issues" style={{color:'#d9df9d'}}>Report a problem in the CANOPY repository</a>
    </div>
  </main>;
 }
}
