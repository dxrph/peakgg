'use client';

import {useEffect, useMemo, useState} from 'react';
import {createTeam} from '../../app/teams/create/actions';
import {normalizeTeamTag, validateTeamLogo} from '../../lib/internal-pages-models.mjs';
import {validateTeam} from '../../lib/domain/rules.mjs';

type Values={name:string;tag:string;region:string;description:string;recruiting:boolean};
type Errors=Partial<Record<'name'|'tag'|'region'|'logo',string>>;

export default function CreateTeamWizard({serverError}:{serverError?:string}){
  const [step,setStep]=useState(0);
  const [values,setValues]=useState<Values>({name:'',tag:'',region:'EU WEST',description:'',recruiting:true});
  const [errors,setErrors]=useState<Errors>({});
  const [logo,setLogo]=useState<File|null>(null);
  const [preview,setPreview]=useState<string>('');

  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview)},[preview]);
  const initials=useMemo(()=>values.name.trim().split(/\s+/).map(v=>v[0]).join('').slice(0,2).toUpperCase()||'PG',[values.name]);

  function update<K extends keyof Values>(key:K,value:Values[K]){setValues(current=>({...current,[key]:value}));setErrors(current=>({...current,[key as keyof Errors]:undefined}))}
  function validateIdentity(){const result=validateTeam({name:values.name,tag:values.tag,region:values.region});setErrors(result.errors);return result.ok}
  function next(){if(step===0&&!validateIdentity())return;if(step===1&&errors.logo)return;setStep(current=>Math.min(2,current+1))}
  function back(){setStep(current=>Math.max(0,current-1))}
  function onLogo(file:File|null){if(preview)URL.revokeObjectURL(preview);if(!file){setLogo(null);setPreview('');setErrors(e=>({...e,logo:undefined}));return}const result=validateTeamLogo(file);if(!result.ok){setLogo(null);setPreview('');setErrors(e=>({...e,logo:result.error||'INVALID LOGO.'}));return}setLogo(file);setPreview(URL.createObjectURL(file));setErrors(e=>({...e,logo:undefined}))}

  return <form action={createTeam} className="peak-container team-wizard" encType="multipart/form-data">
    {serverError&&<p className="form-error team-wizard-server-error" role="alert">{serverError}</p>}
    <ol className="team-wizard-steps" aria-label="Create team progress">
      {['IDENTITY','PROFILE','REVIEW'].map((label,index)=><li key={label} className={index===step?'is-active':index<step?'is-complete':''}><span>0{index+1}</span><strong>{label}</strong></li>)}
    </ol>

    <div className="team-wizard-layout">
      <section className="team-wizard-panel" aria-live="polite">
        {step===0&&<>
          <p className="internal-kicker">STEP 01 / IDENTITY</p><h2>NAME THE SQUAD.</h2>
          <Field label="TEAM NAME" error={errors.name}><input name="name" value={values.name} onChange={e=>update('name',e.target.value)} required minLength={2} autoComplete="organization"/></Field>
          <Field label="TEAM TAG" error={errors.tag}><input name="tag" value={values.tag} onChange={e=>update('tag',normalizeTeamTag(e.target.value))} required minLength={2} maxLength={6} inputMode="text"/></Field>
          <Field label="REGION" error={errors.region}><select name="region" value={values.region} onChange={e=>update('region',e.target.value)}><option>EU WEST</option><option>EU NORTH/EAST</option><option>EU OTHER</option></select></Field>
        </>}

        {step===1&&<>
          <p className="internal-kicker">STEP 02 / PROFILE</p><h2>SET THE SIGNAL.</h2>
          <Field label="DESCRIPTION"><textarea name="description" value={values.description} onChange={e=>update('description',e.target.value)} maxLength={300} placeholder="WHAT ARE YOU BUILDING?"/></Field>
          <Field label="TEAM LOGO" error={errors.logo}><input name="logo" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>onLogo(e.target.files?.[0]||null)}/><small>PNG, JPEG OR WEBP · MAX 2 MB · PREVIEW IS LOCAL FOR NOW.</small></Field>
          <label className="team-wizard-toggle"><input name="recruiting" type="checkbox" checked={values.recruiting} onChange={e=>update('recruiting',e.target.checked)}/><span aria-hidden="true"/><strong>RECRUITING {values.recruiting?'ON':'OFF'}</strong></label>
        </>}

        {step===2&&<>
          <p className="internal-kicker">STEP 03 / REVIEW</p><h2>READY TO QUEUE.</h2>
          <dl className="team-review-data"><div><dt>TEAM</dt><dd>{values.name||'—'}</dd></div><div><dt>TAG</dt><dd>{values.tag||'—'}</dd></div><div><dt>REGION</dt><dd>{values.region}</dd></div><div><dt>RECRUITING</dt><dd>{values.recruiting?'OPEN':'CLOSED'}</dd></div></dl>
          <p className="team-wizard-note">TEAM DATA IS SAVED THROUGH THE EXISTING SECURE SERVER ACTION. THE LOGO PREVIEW IS LOCAL UNTIL STORAGE UPLOAD IS WIRED.</p>
        </>}
      </section>

      <aside className="team-wizard-preview" aria-label="Team preview">
        <p className="internal-kicker">LIVE PREVIEW</p>
        <div className="team-preview-mark">{preview?<img src={preview} alt="Selected team logo preview"/>:<span>{initials}</span>}</div>
        <strong>{values.name||'YOUR TEAM'}</strong><em>[{values.tag||'TAG'}]</em><p>{values.region}</p><i>{values.recruiting?'RECRUITING':'ROSTER CLOSED'}</i>
      </aside>
    </div>

    <div className="team-wizard-actions">
      {step>0&&<button type="button" className="peak-button secondary" onClick={back}>BACK</button>}
      {step<2?<button type="button" className="peak-button" onClick={next}>CONTINUE</button>:<button className="peak-button" type="submit" onClick={e=>{if(!validateIdentity()||errors.logo)e.preventDefault()}}>CREATE TEAM</button>}
    </div>

    {step!==0&&<><input type="hidden" name="name" value={values.name}/><input type="hidden" name="tag" value={values.tag}/><input type="hidden" name="region" value={values.region}/></>}
    {step!==1&&<><input type="hidden" name="description" value={values.description}/>{values.recruiting&&<input type="hidden" name="recruiting" value="on"/>}</>}
  </form>
}

function Field({label,error,children}:{label:string;error?:string;children:React.ReactNode}){return <div className="form-field team-wizard-field"><label>{label}</label>{children}{error&&<p className="field-error" role="alert">{error}</p>}</div>}
