import { ChangeEvent, useState, useMemo, useRef } from "react";
import { FileVideo, Upload } from "lucide-react";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export function VideoInputForm() {
  const [videoFile, setVideoFile] = useState<File | undefined>(undefined);
  const promptInputRef = useRef<HTMLTextAreaElement>(null)

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const { files } = event.currentTarget

    if (!files) return

    const selectedFile = files[0]

    setVideoFile(selectedFile)
  }

  async function convertVideoToAudio(video: File) {
    console.log('Convert started')

    const ffmpeg = await getFFmpeg()
    console.log('getFFmpeg')

    await ffmpeg.writeFile('input.mp4', await fetchFile(video))
    console.log('writeFile')

    // ffmpeg.on('log', log => {
    //   console.log(log)
    // })

    ffmpeg.on('progress', progress => {
      console.log('Convert progress: ' + Math.round(progress.progress * 100))
    })

    await ffmpeg.exec([
      '-i',
      'input.mp4',
      '-map',
      '0:a',
      '-b:a',
      '20k',
      '-acodec',
      'libmp3lame',
      'output.mp3'
    ])
    console.log('exec')

    const data = await ffmpeg.readFile('output.mp3')
    console.log('readFile')

    const audioFileBlob = new Blob([data], { type: 'audio/mp3' })
    const audioFile = new File([audioFileBlob], 'audio.mp3', {
      type: 'audio/mpeg'
    })

    console.log('Convert finished')

    return audioFile
  }

  async function handleUploadVideo(event: ChangeEvent<HTMLFormElement>) {
    event.preventDefault()

    const prompt = promptInputRef.current?.value

    if (!videoFile) {
      return
    }

    console.log(prompt)
    // converter vídeo em áudio
    const audioFile = await convertVideoToAudio(videoFile)

    console.log(audioFile)
  }

  const previewURL = useMemo(() => {
    if (!videoFile) return undefined

    return URL.createObjectURL(videoFile)
  }, [videoFile])

  return (
    <form className="space-y-4" onSubmit={handleUploadVideo}>
      <label
        htmlFor="video"
        className="relative border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/20"
      >
        {videoFile ? (
          <video src={previewURL} controls={false} className="pointer-events-none absolute inset-0 rounded-md" />
        ) : (
          <>
            <FileVideo className='w-4 h4' />
            Carregar vídeo
          </>
        )}
      </label>

      <input type="file" id="video" accept="video/mp4" className="sr-only" onChange={handleFileSelected} />

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="transcription_prompt">
          Prompt de transcrição
        </Label>
        <Textarea
          ref={promptInputRef}
          id="transcription_prompt"
          className="h-20 leading-relaxed resize-none"
          placeholder="Inclua palavras-chave mencionadas no vídeo separadas por vírgula (,)"
        />
      </div>

      <Button type="submit" className="w-full">
        Carregar vídeo
        <Upload className="w-4 h-4 ml-2" />
      </Button>
    </form>
  )
}