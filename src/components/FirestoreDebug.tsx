// ตัวอย่างใน React component
import { useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function FirestoreDebug() {
  useEffect(() => {
    const run = async () => {
      // เขียน
      const docRef = await addDoc(collection(db, 'test'), {
        message: 'Hello Firestore',
        createdAt: new Date(),
      });
      console.log('Written doc id:', docRef.id);

      // อ่าน
      const snap = await getDocs(collection(db, 'test'));
      snap.forEach((d) => console.log(d.id, d.data()));
    };

    run().catch(console.error);
  }, []);

  return null;
}
