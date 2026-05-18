'use client'
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function StoreForm() {
  const [searchCode, setSearchCode] = useState('');
  const [storeData, setStoreData] = useState(null);
  const [postcardData, setPostcardData] = useState({ received: false, packs_made: false });
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
      
      if (data.City?.toLowerCase() === 'chennai') {
        const { data: pcData } = await supabase
          .from('postcard_tracking')
          .select('*')
          .eq('store_code', data.Store_Code)
          .single();
        if (pcData) {
          setPostcardData({ received: pcData.received, packs_made: pcData.packs_made });
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

    let pcErr = null;
    if (storeData.City?.toLowerCase() === 'chennai') {
      const { error } = await supabase
        .from('postcard_tracking')
        .upsert({
          store_code: storeData.Store_Code,
          received: postcardData.received,
          packs_made: postcardData.packs_made,
          updated_at: new Date()
        }, { onConflict: 'store_code' });
      pcErr = error;
    }

    if (storeErr || pcErr) {
      setStatus('Error saving data. Please contact support.');
    } else {
      setStatus('Successfully updated! Thank you.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 text-black">
      <div className="max-w-xl w-full bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">TRENDS Store Update Form</h2>
        
        {!storeData ? (
          <div className="flex flex-col gap-4">
            <label className="font-semibold">Enter Store Code to proceed:</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="border p-2 flex-grow rounded uppercase"
                placeholder="e.g., TAV7"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
              />
              <button onClick={fetchStore} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700">
                Fetch
              </button>
            </div>
            <p className="text-red-600 font-semibold">{status}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded border">
              <div>
                <label className="text-xs text-gray-500 font-bold uppercase">Store Code</label>
                <p className="font-semibold">{storeData.Store_Code}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-bold uppercase">Store Name</label>
                <p className="font-semibold">{storeData.Store_Name}</p>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">City</label>
              <input 
                type="text" 
                className="border p-2 w-full rounded"
                value={storeData.City || ''}
                onChange={(e) => setStoreData({...storeData, City: e.target.value})}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">SM Name</label>
              <input 
                type="text" 
                className="border p-2 w-full rounded"
                placeholder="Enter Store Manager Name"
                value={storeData.SM || ''}
                onChange={(e) => setStoreData({...storeData, SM: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">SM Mobile</label>
              <input 
                type="number" 
                className="border p-2 w-full rounded"
                placeholder="Enter 10-digit Mobile Number"
                value={storeData.SM_Mobile || ''}
                onChange={(e) => setStoreData({...storeData, SM_Mobile: e.target.value})}
                required
              />
            </div>

            {storeData.City?.toLowerCase() === 'chennai' && (
              <div className="mt-4 p-4 border border-blue-300 bg-blue-50 rounded">
                <h3 className="font-bold mb-3 text-blue-800">Chennai Stores: Postcard & Zepto Delivery</h3>
                
                <label className="block font-semibold mb-2">Have you received post cards from Vendor?</label>
                <select 
                  className="border p-2 w-full rounded mb-4"
                  value={postcardData.received ? 'Yes' : 'No'}
                  onChange={(e) => setPostcardData({...postcardData, received: e.target.value === 'Yes'})}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>

                {postcardData.received && (
                  <>
                    <label className="block font-semibold mb-2">If received, made packs of 500s and is it ready for delivery to Zepto?</label>
                    <select 
                      className="border p-2 w-full rounded"
                      value={postcardData.packs_made ? 'Yes' : 'No'}
                      onChange={(e) => setPostcardData({...postcardData, packs_made: e.target.value === 'Yes'})}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </>
                )}
              </div>
            )}

            <button type="submit" className="bg-green-600 text-white font-bold text-lg p-3 rounded mt-4 hover:bg-green-700">
              Submit Data
            </button>
            
            <p className="text-center font-bold text-blue-600">{status}</p>
          </form>
        )}
      </div>
    </div>
  );
}