'use client'
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function StoreForm() {
  const [searchCode, setSearchCode] = useState('');
  const [storeData, setStoreData] = useState(null);
  const [postcardStatus, setPostcardStatus] = useState(''); 
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

    const { error: storeErr } = await supabase
      .from('Stores')
      .update({
        City: storeData.City,
        SM: storeData.SM,
        SM_Mobile: storeData.SM_Mobile
      })
      .eq('Store_Code', storeData.Store_Code);

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-800 font-sans antialiased">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        
        {/* Top Branding Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-6 text-center text-white">
          <h2 className="text-2xl font-extrabold tracking-tight">TRENDS</h2>
          <p className="text-xs text-blue-100 font-medium mt-1 uppercase tracking-wider">Store Update & Logistics Tracker</p>
        </div>
        
        <div className="p-6 space-y-6">
          {!storeData ? (
            /* Lookup Screen */
            <div className="space-y-4">
              <div className="bg-blue-50 text-blue-800 border border-blue-100 rounded-xl p-4 text-sm leading-relaxed font-medium">
                Welcome! Please enter your store branch code to pull your current records and complete the update.
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Store Code</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none p-3.5 flex-grow rounded-xl uppercase font-bold text-slate-900 tracking-widest text-lg transition-all"
                    placeholder="e.g. TAV7"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                  />
                  <button onClick={fetchStore} className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl font-bold transition-all text-base active:scale-95 shadow-md shadow-blue-100">
                    Fetch
                  </button>
                </div>
              </div>
              {status && <p className="text-sm font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 text-center">{status}</p>}
            </div>
          ) : (
            /* Operational Entry Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Store Reference Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Store Code</label>
                  <p className="font-bold text-slate-800 text-base mt-0.5">{storeData.Store_Code}</p>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Store Name</label>
                  <p className="font-bold text-slate-800 text-sm mt-0.5 truncate">{storeData.Store_Name}</p>
                </div>
              </div>

              {/* Input Parameters */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">City</label>
                  <input 
                    type="text" 
                    className="border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none p-3 w-full rounded-xl transition-all font-medium text-slate-900"
                    value={storeData.City || ''}
                    onChange={(e) => setStoreData({...storeData, City: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Store Manager Name</label>
                  <input 
                    type="text" 
                    className="border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none p-3 w-full rounded-xl transition-all font-medium text-slate-900"
                    placeholder="Enter full name"
                    value={storeData.SM || ''}
                    onChange={(e) => setStoreData({...storeData, SM: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">SM Mobile Number</label>
                  <input 
                    type="number" 
                    className="border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none p-3 w-full rounded-xl transition-all font-medium text-slate-900 tracking-wide text-base"
                    placeholder="Enter 10-digit number"
                    value={storeData.SM_Mobile || ''}
                    onChange={(e) => setStoreData({...storeData, SM_Mobile: e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* Campaign Logistics Selection Card */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Material Logistics Status</h3>
                
                {/* Embedded Reference Image */}
                <div className="space-y-1.5 bg-slate-50 p-2.5 border border-slate-200/60 rounded-xl">
                  <span className="block text-[11px] font-bold text-slate-500 text-center uppercase tracking-wide">Campaign Postcard Reference Visual</span>
                  <div className="relative w-full h-36 rounded-lg overflow-hidden bg-slate-200 shadow-inner">
                    <Image 
                      src="/postcard.png" 
                      alt="Campaign Postcard Reference" 
                      fill 
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Have you received post cards from Vendor?</label>
                  <select 
                    className="border border-slate-200 focus:border-blue-500 outline-none p-3 w-full rounded-xl bg-white font-semibold text-slate-700 h-12 shadow-sm"
                    value={postcardStatus}
                    onChange={(e) => setPostcardStatus(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- Select Current Status --</option>
                    <option value="chennai_yes">Chennai store - yes received it</option>
                    <option value="rotn_yes">RoTN store received it</option>
                    <option value="not_received">Not yet received</option>
                  </select>
                </div>

                {/* Chennai Nested Conditional Routing */}
                {postcardStatus === 'chennai_yes' && (
                  <div className="p-4 border border-blue-200 bg-blue-50/50 rounded-xl space-y-2.5">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 tracking-wider">Chennai Logic Routing</span>
                    <label className="block text-xs font-bold text-slate-700 leading-normal">Have you made bundles of 500 and kept it ready for dispatch to Zepto?</label>
                    <select 
                      className="border border-slate-200 focus:border-blue-500 outline-none p-2.5 w-full rounded-lg bg-white font-semibold text-slate-700"
                      value={packsMade}
                      onChange={(e) => setPacksMade(e.target.value)}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                )}

                {/* Rest of TN Nested Conditional Routing */}
                {postcardStatus === 'rotn_yes' && (
                  <div className="p-4 border border-emerald-200 bg-emerald-50/40 rounded-xl space-y-2.5">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 tracking-wider">RoTN Logic Routing</span>
                    <label className="block text-xs font-bold text-slate-700 leading-normal">Have you started localized neighborhood distribution?</label>
                    <select 
                      className="border border-slate-200 focus:border-emerald-500 outline-none p-2.5 w-full rounded-lg bg-white font-semibold text-slate-700"
                      value={startedDistribution}
                      onChange={(e) => setStartedDistribution(e.target.value)}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                )}

                {/* Not Received Warning Exception Box */}
                {postcardStatus === 'not_received' && (
                  <div className="p-4 border border-amber-200 bg-amber-50/60 rounded-xl text-xs space-y-1.5 text-amber-900">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 tracking-wider">Action Required</span>
                    <p className="font-medium leading-relaxed">Please check for the **POD number** from your dispatch vendor immediately and check delivery status.</p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base p-3.5 rounded-xl transition-all active:scale-98 shadow-md shadow-emerald-100">
                  Submit Data
                </button>
              </div>
              
              {status && (
                <p className={`text-center font-bold p-3.5 rounded-xl text-xs shadow-inner ${status.includes('Successfully') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                  {status}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
