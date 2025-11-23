"use client"

import NewProductForm from '../../../components/NewProductForm'

export default function NewProductPage(){
  return (
    <div className="admin-container compact-edit">
      <div className="card">
        <NewProductForm />
      </div>
    </div>
  )
}
