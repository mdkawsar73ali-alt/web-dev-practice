import React from 'react'
export default function Navbar({active,setActive,user,onSignOut}){
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%'}}>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        
        <div style={{display:'flex',gap:8,marginLeft:12}} className="nav">
          <button className={'btn '+(active==='home'?'active':'')} onClick={()=>setActive('home')}>Home</button>
          <button className={'btn '+(active==='friends'?'active':'')} onClick={()=>setActive('friends')}>Friends</button>
          <button className={'btn '+(active==='messages'?'active':'')} onClick={()=>setActive('messages')}>Messages</button>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        
        <div className="small">Hi, {user.displayName}</div>
        <button className="btn" onClick={onSignOut}>Sign out</button>
      </div>
    </div>
  )
}
