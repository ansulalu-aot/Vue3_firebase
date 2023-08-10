import { ref, watchEffect } from 'vue'
import { projectFirestore } from '../firebase/config'

const getCollection = (collection) => {
    const documents = ref(null)
    const error = ref(null)

    let collectionRef = projectFirestore.collection(collection)
        .orderBy('createdAt')
    console.log('Collection Reference:', collectionRef);
    const unsub = collectionRef.onSnapshot((snap) => {
        console.log('snapshot')
        let results = []
        snap.docs.forEach(doc => {
            doc.data().createdAt && results.push({ ...doc.data(), id: doc.id })
        })
        documents.value =  results
        error.value = null
        console.log('Documents:', documents.value)
    }, (err) => {
        console.log(err.message)
        error.value  = 'could not fetch data'
    })

    watchEffect((onValidate) => {
        // unsub from prev collection when watcher is stopped (component unmounted)
        onValidate(() => unsub())
    })

    return { documents, error }
}

export default getCollection