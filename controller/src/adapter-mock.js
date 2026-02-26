

export const adapter = {
  publish: async (sceneId) => {
    console.log('Scene triggered:', sceneId)
  },

  connect: async (db) => {
    db = "firebase"
    console.log(`connected to ${db}`)
  }


}