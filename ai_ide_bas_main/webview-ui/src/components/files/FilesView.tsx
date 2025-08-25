import React, { useCallback, useEffect, useMemo, useState } from "react"
import { vscode } from "@src/utils/vscode"

type FileItem = { id?: string; filename: string; public_url?: string | null; project?: string | null }

const FilesView: React.FC<{ onDone?: () => void }> = () => {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false)
  const [files, setFiles] = useState<FileItem[]>([])
  const [projectName, setProjectName] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [notice, setNotice] = useState<string | undefined>(undefined)

  const refreshStatus = useCallback(() => {
    vscode.postMessage({ type: "files:status" })
  }, [])

  const requestList = useCallback(() => {
    setLoading(true)
    setError(undefined)
    setNotice(undefined)
    const values: any = {}
    if (projectName.trim()) values.projectName = projectName.trim()
    vscode.postMessage({ type: "files:list", values })
  }, [projectName])

  const requestLogin = useCallback(() => {
    vscode.postMessage({ type: "files:login" })
  }, [])

  const requestLogout = useCallback(() => {
    vscode.postMessage({ type: "files:logout" })
  }, [])

  const requestUpload = useCallback(() => {
    vscode.postMessage({ type: "files:chooseUpload", values: { projectName: projectName.trim() || undefined } })
  }, [projectName])

  const openPublicUrl = useCallback((url?: string | null) => {
    if (!url) return
    vscode.postMessage({ type: "openExternal", url })
  }, [])

  // Удаление файлов отключено для релиза
  const _unusedConfirmAndDelete = undefined as unknown as (file: FileItem) => void

  useEffect(() => {
    const onMessage = (e: MessageEvent<any>) => {
      const message = e.data
      if (message?.type === "files:authChanged") {
        setIsAuthorized(Boolean(message.isAuthorized))
        if (message.isAuthorized) {
          requestList()
        } else {
          setFiles([])
        }
      } else if (message?.type === "files:list:result") {
        const raw = Array.isArray(message.files) ? message.files : []
        const normalized = raw.map((it: any) => ({
          ...it,
          id: it?.id ?? it?.file_id ?? it?.fileId ?? undefined,
        }))
        setFiles(normalized)
        setLoading(false)
      } else if (message?.type === "files:delete:result") {
        setNotice('Файл успешно удален')
      } else if (message?.type === "files:error") {
        const status = message?.values?.status
        if (status === 401) setError('Необходимо войти в систему')
        else if (status === 403) setError('У вас нет прав для удаления этого файла')
        else if (status === 404) setError('Файл не найден')
        else if (status === 400) setError('Некорректный идентификатор файла')
        else setError(String(message.error || 'Ошибка'))
        setLoading(false)
      }
    }

    window.addEventListener("message", onMessage)
    refreshStatus()
    return () => window.removeEventListener("message", onMessage)
  }, [refreshStatus, requestList])

  const body = useMemo(() => {
    if (!isAuthorized) {
      return (
        <div className="p-4 space-y-3">
          <div className="text-lg">Войдите, чтобы работать с файлами</div>
          <button className="btn" onClick={requestLogin}>
            Войти
          </button>
          {/* Ввод токена отключён */}
        </div>
      )
    }

    return (
      <div className="p-4 space-y-4">
        <div className="flex gap-2 items-center">
          <input className="input" placeholder="project_name" value={projectName} onChange={(e)=>setProjectName(e.target.value)} />
          <button className="btn" onClick={requestList} disabled={loading}>
            {loading ? "Загрузка..." : "Обновить список"}
          </button>
          <button className="btn" onClick={requestUpload}>
            Загрузить файл
          </button>
          <button className="btn" onClick={requestLogout}>
            Выйти
          </button>
        </div>
        {notice && <div className="text-green-600">{notice}</div>}
        {error && <div className="text-red-500">{error}</div>}
        <div className="space-y-2">
          {files.length === 0 ? (
            <div className="text-sm text-muted">Файлов нет</div>
          ) : (
            files.map((f) => (
              <div key={f.filename + (f.project || "")} className="flex justify-between items-center border p-2 rounded">
                <div className="flex flex-col">
                  <div className="font-mono text-sm">{f.filename}</div>
                  {f.project ? <div className="text-xs text-muted">{f.project}</div> : null}
                  {f.public_url ? (
                    <button className="link text-xs" onClick={() => openPublicUrl(f.public_url)}>Открыть</button>
                  ) : null}
                </div>
                <div className="flex items-center gap-2" />
              </div>
            ))
          )}
        </div>
      </div>
    )
  }, [isAuthorized, files, loading, error, notice, requestList, requestLogout, requestLogin, requestUpload, openPublicUrl, projectName])

  return <div>{body}</div>
}

export default FilesView

// TokenInput удалён для релиза


