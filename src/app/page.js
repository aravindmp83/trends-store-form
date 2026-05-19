'use client'
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function StoreForm() {
  const [searchCode, setSearchCode] = useState('');
  const [storeData, setStoreData] = useState(null);
  const [postcardStatus, setPostcardStatus] = useState(''); // 'chennai_yes', 'rotn_yes', 'not_received'
  const [packsMade, setPacksMade] = useState('No');
  const [startedDistribution, setStartedDistribution] = useState('No');
  const [status, setStatus] = useState('');

  const fetchStore = async () => {
    setStatus('Loading...');
    const { data, error } = await supabase
      .from('Stores')
      .select('*')
      .eq('Store_Code', searchCode.toUpperCase())
      .single();

    if (error || !data) {
      setStatus('Store not found. Please verify the Store Code.');
      setStoreData(null);
    } else {
      setStoreData(data);
      setStatus('');
      
      // Pull existing tracking records if they exist to pre-fill the form
      const { data: pcData } = await supabase
        .from('postcard_tracking')
        .select('*')
        .eq('store_code', data.Store_Code)
        .single();

      if (pcData) {
        setPostcardStatus(pcData.postcard_status || '');
        setPacksMade(pcData.packs_made ? 'Yes' : 'No');
        setStartedDistribution(pcData.started_distribution ? 'Yes' : 'No');
      } else {
        // Intelligent defaults based on database master data location
        if (data.City?.toLowerCase() === 'chennai') {
          setPostcardStatus('chennai_yes');
        } else {
          setPostcardStatus('rotn_yes');
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Saving updates...');

    // 1. Update Core Store Profile
    const { error: storeErr } = await supabase
      .from('Stores')
      .update({
        City: storeData.City,
        SM: storeData.SM,
        SM_Mobile: storeData.SM_Mobile
      })
      .eq('Store_Code', storeData.Store_Code);

    // 2. Process Operations Checklist Mapping
    const { error: pcErr } = await supabase
      .from('postcard_tracking')
      .upsert({
        store_code: storeData.Store_Code,
        postcard_status: postcardStatus,
        packs_made: postcardStatus === 'chennai_yes' ? (packsMade === 'Yes') : false,
        started_distribution: postcardStatus === 'rotn_yes' ? (startedDistribution === 'Yes') : false,
        updated_at: new Date()
      }, { onConflict: 'store_code' });

    if (storeErr || pcErr) {
      setStatus('Error saving data. Please contact regional support.');
    } else {
      setStatus('Successfully updated operational data! Thank you.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 md:p-8 text-slate-800 font-sans">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8 transition-all">
        
        {/* Header Block */}
        <div className="border-b border-slate-100 pb-5 mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-blue-900">TRENDS</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Regional Store Performance & Logistics Tracker</p>
        </div>
        
        {!storeData ? (
          /* Authentication Screen */
          <div className="space-y-4">
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
              Please clear out verification data updates by identifying your location branch code below.
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Enter Store Code:</label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  className="border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none p-3 flex-grow rounded-xl uppercase font-semibold text-slate-900 tracking-wider transition-all"
                  placeholder="e.g., TAV7"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                />
                <button onClick={fetchStore} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-sm shadow-blue-200">
                  Fetch
                </button>
              </div>
            </div>
            {status && <p className="text-sm font-semibold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{status}</p>}
          </div>
        ) : (
          /* Operational Input Screen */
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Store Meta Card */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Store Code</label>
                <p className="font-bold text-slate-800 text-lg">{storeData.Store_Code}</p>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Store Name</label>
                <p className="font-bold text-slate-800 text-base line-clamp-1">{storeData.Store_Name}</p>
              </div>
            </div>

            {/* Basic Contacts */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">City</label>
                <input 
                  type="text" 
                  className="border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none p-2.5 w-full rounded-lg transition-all"
                  value={storeData.City || ''}
                  onChange={(e) => setStoreData({...storeData, City: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Store Manager Name</label>
                <input 
                  type="text" 
                  className="border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none p-2.5 w-full rounded-lg transition-all"
                  placeholder="Enter contact full name"
                  value={storeData.SM || ''}
                  onChange={(e) => setStoreData({...storeData, SM: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Store Manager Contact Mobile</label>
                <input 
                  type="number" 
                  className="border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none p-2.5 w-full rounded-lg transition-all"
                  placeholder="Enter 10-digit primary mobile"
                  value={storeData.SM_Mobile || ''}
                  onChange={(e) => setStoreData({...storeData, SM_Mobile: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* Campaign Logistics Management Core */}
            <div className="border-t border-slate-100 pt-5 space-y-4">
              <h3 className="font-bold text-base text-slate-900 tracking-tight">Campaign Material Distribution Logistics</h3>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Have you received post cards from Vendor?</label>
                <select 
                  className="border border-slate-200 focus:border-blue-500 outline-none p-2.5 w-full rounded-lg bg-white transition-all font-medium text-slate-700"
                  value={postcardStatus}
                  onChange={(e) => setPostcardStatus(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Select Current Logistics Status --</option>
                  <option value="chennai_yes">Chennai store - yes received it</option>
                  <option value="rotn_yes">RoTN store received it</option>
                  <option value="not_received">Not yet received</option>
                </select>
              </div>

              {/* Conditional Routing Level 1: Chennai Verification Branch */}
              {postcardStatus === 'chennai_yes' && (
                <div className="p-4 border border-blue-200 bg-blue-50/50 rounded-xl space-y-3 animation-fade">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Chennai Routing Context</span>
                  <label className="block text-sm font-semibold text-slate-800">Have you made bundles of 500 and kept it ready for dispatch to Zepto?</label>
                  <select 
                    className="border border-slate-200 focus:border-blue-500 outline-none p-2 w-full rounded-lg bg-white font-medium text-slate-700"
                    value={packsMade}
                    onChange={(e) => setPacksMade(e.target.value)}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              )}

              {/* Conditional Routing Level 2: Rest of Tamil Nadu Verification Branch */}
              {postcardStatus === 'rotn_yes' && (
                <div className="p-4 border border-emerald-200 bg-emerald-50/40 rounded-xl space-y-3 animation-fade">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">RoTN Regional Context</span>
                  <label className="block text-sm font-semibold text-slate-800">Have you started localized neighborhood distribution?</label>
                  <select 
                    className="border border-slate-200 focus:border-emerald-500 outline-none p-2 w-full rounded-lg bg-white font-medium text-slate-700"
                    value={startedDistribution}
                    onChange={(e) => setStartedDistribution(e.target.value)}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              )}

              {/* Conditional Routing Level 3: Non-Delivery Vendor Exception Branch */}
              {postcardStatus === 'not_received' && (
                <div className="p-4 border border-amber-200 bg-amber-50/50 rounded-xl text-sm space-y-2 text-amber-900 animation-fade">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Action Required</span>
                  <p className="font-medium mt-1">Please secure the **POD number (Proof of Delivery)** tracking file details from the central production dispatch vendor immediately to log delivery transit status.</p>
                </div>
              )}
            </div>

            {/* Submit Control Action */}
            <div className="pt-3">
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base p-3.5 rounded-xl transition-colors shadow-sm shadow-emerald-100">
                Submit & Log Updates
              </button>
            </div>
            
            {status && (
              <p className={`text-center font-bold p-3 rounded-lg text-sm ${status.includes('Successfully') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                {status}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
