import { getProducts } from "../lib/getProducts";
import { Suspense } from 'react'
import ModelListClient from '../components/ModelListClient'

export default async function ModelIndex() {
  const products = await getProducts()

  return (
    <Suspense fallback={<div />}> 
      <ModelListClient products={JSON.parse(JSON.stringify(products || []))} />
    </Suspense>
  )
}
