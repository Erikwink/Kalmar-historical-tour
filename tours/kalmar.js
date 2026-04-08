import image from "./img/kalmar-sund.png"

export default {
  id:    "kalmar",
  title: "Kalmar",
  image,
  icon:            "castle",
  durationMinutes: 120,
  scenes: [
    {
      id:       "castle",
      label:    "Kalmar slott",
      icon:     "castle",
      color:    "#573c9b",
      controls: [
        {
          id: "castle-360",
          type: "360-photo",
          label: "Visa slottet",
          src: "castle/castle.jpg" 
        },
        { 
          id: "castle-amb",
          type: "audio",
          label: "Ambient ljud",
          src: "castle/ambient.mp3" 
        },
        { 
         id: "castle-nar",
         type: "narration",
         label: "Berättarröst",
         src: "castle/narration.mp3" 
        },
      ],
    },
    {
      id:       "church",
      label:    "Kalmar domkyrka",
      icon:     "church",
      color:    "#121c2c",
      controls: [
        { 
          id: "church-360",
          type: "360-photo",
          label: "Visa kyrkan",
          src: "church/image.jpg" 
        },
        { 
          id: "church-org",
          type: "audio",
          label: "Orgelmusik",
          src: "church/organ.mp3" 
        },
      ],
    },
  ],
}
