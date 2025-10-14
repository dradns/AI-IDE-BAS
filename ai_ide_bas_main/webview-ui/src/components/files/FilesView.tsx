import React, { useCallback, useEffect, useMemo, useState } from "react"
import { vscode } from "@src/utils/vscode"

type FileItem = { id?: string; filename: string; public_url?: string | null; project?: string | null }

type Visibility = "private" | "public" | "org"

const FilesView: React.FC<{ onDone?: () => void }> = () => {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false)
  const [files, setFiles] = useState<FileItem[]>([])
  const [projectName, setProjectName] = useState<string>("")
  const [search, setSearch] = useState<string>("")
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [notice, setNotice] = useState<string | undefined>(undefined)
  const [virtualKey, setVirtualKey] = useState<string | undefined>(undefined)
  const [virtualKeyId, setVirtualKeyId] = useState<string | undefined>(undefined)
  const [shareVisibility, setShareVisibility] = useState<Visibility>("public")

  const refreshStatus = useCallback(() => {
    vscode.postMessage({ type: "files:status" })
  }, [])

  const requestList = useCallback(() => {
    setLoading(true)
    setError(undefined)
    setNotice(undefined)
    const values: any = {}
    if (projectName.trim()) values.projectName = projectName.trim()
    if (search.trim()) values.search = search.trim()
    if (page) values.page = page
    if (pageSize) values.pageSize = pageSize
    vscode.postMessage({ type: "files:list", values })
  }, [projectName, search, page, pageSize])

  const requestLogin = useCallback(() => {
    vscode.postMessage({ type: "files:login" })
  }, [])

  const requestLogout = useCallback(() => {
    vscode.postMessage({ type: "files:logout" })
  }, [])

  const requestUpload = useCallback(() => {
    vscode.postMessage({ type: "files:chooseUpload", values: { projectName: projectName.trim() || undefined } })
  }, [projectName])

  const requestDownload = useCallback((idOrName: string) => {
    vscode.postMessage({ type: "files:download", text: idOrName })
  }, [])

  const requestShareProject = useCallback(() => {
    if (!projectName.trim()) {
      setError("Укажите project_name для публикации")
      return
    }
    vscode.postMessage({ type: "files:share", values: { projectName: projectName.trim(), visibility: shareVisibility } })
  }, [projectName, shareVisibility])

  const openPublicUrl = useCallback((url?: string | null) => {
    if (!url) return
    vscode.postMessage({ type: "openExternal", url })
  }, [])

  const requestDelete = useCallback((file: FileItem) => {
    const idOrName = file.id || file.filename
    if (!idOrName) return
    vscode.postMessage({ type: "files:delete", text: idOrName, values: { projectName: projectName.trim() || undefined } })
  }, [projectName])

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
      } else if (message?.type === "files:virtualKey") {
        if (typeof message.key === 'string' && message.key.trim()) {
          setVirtualKey(message.key.trim())
          if (typeof message.keyId === 'string' && message.keyId.trim()) {
            setVirtualKeyId(message.keyId.trim())
          }
          setNotice('Получен виртуальный ключ DeepSeek')
        }
      } else if (message?.type === "files:delete:result") {
        setNotice('Файл успешно удален')
      } else if (message?.type === "files:notice") {
        if (typeof message.text === 'string' && message.text) setNotice(message.text)
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
        <div className="p-6 space-y-4">
          <div className="text-xl font-semibold">Хранилище файлов AI IDE BAS</div>
          <div className="text-sm text-vscode-descriptionForeground">
            Авторизуйтесь через Google, чтобы загружать, скачивать и делиться файлами по проектам.
          </div>
          <button
            className="h-10 rounded-full px-4 inline-flex items-center gap-2 border border-vscode-editorWidget-border bg-[color:var(--vscode-editor-background)] hover:bg-vscode-list-hoverBackground"
            onClick={requestLogin}
            aria-label="Sign in with Google">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.7 0 7 1.3 9.6 3.8l7.2-7.2C36.6 2 30.8 0 24 0 14.6 0 6.4 5.3 2.4 13l8.8 6.8C13 14.1 18.1 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.7-.4-4H24v8h12.7c-.6 3.1-2.4 5.7-5 7.4l7.7 6c4.5-4.2 7.1-10.4 7.1-17.4z"/>
              <path fill="#FBBC05" d="M11.2 28.2C10.7 26.7 10.5 25 10.5 23s.2-3.7.7-5.2l-8.8-6.8C.8 14.8 0 18.3 0 23c0 4.7.8 8.2 2.4 12l8.8-6.8z"/>
              <path fill="#34A853" d="M24 46c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.2 2.3-6 0-11.1-4.1-12.8-9.6l-8.8 6.8C6.4 42.7 14.6 46 24 46z"/>
            </svg>
            <span className="text-sm">Sign in with Google</span>
          </button>
          <div className="text-xs text-vscode-descriptionForeground">
            После входа вы сможете загружать файлы, получать публичные ссылки и делиться проектами.
          </div>
        </div>
      )
    }

    return (
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Файлы и проекты</div>
          <div className="flex items-center gap-2">
            <button className="btn" onClick={requestUpload}>Загрузить</button>
            <button className="btn" onClick={requestLogout}>Выйти</button>
          </div>
        </div>

        {virtualKey && (
          <div className="border rounded p-3 bg-vscode-sideBar-background">
            <div className="text-sm mb-2">Виртуальный ключ DeepSeek{virtualKeyId ? ` (ID: ${virtualKeyId})` : ''}</div>
            <div className="flex gap-2 items-center">
              <input className="input font-mono text-xs" readOnly value={virtualKey} />
              <button
                className="btn"
                onClick={() => {
                  navigator.clipboard.writeText(virtualKey)
                  setNotice('Ключ скопирован в буфер обмена')
                }}
              >
                Копировать
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border rounded p-3 flex flex-col gap-2">
            <label className="text-xs text-vscode-descriptionForeground">Проект</label>
            <input className="input" placeholder="project_name" value={projectName} onChange={(e)=>setProjectName(e.target.value)} />
          </div>
          <div className="border rounded p-3 flex flex-col gap-2">
            <label className="text-xs text-vscode-descriptionForeground">Поиск</label>
            <input className="input" placeholder="поиск по имени" value={search} onChange={(e)=>setSearch(e.target.value)} />
          </div>
          <div className="border rounded p-3 flex flex-col gap-2">
            <label className="text-xs text-vscode-descriptionForeground">Размер страницы</label>
            <select className="input" value={pageSize} onChange={(e)=>setPageSize(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="border rounded p-3 flex flex-col gap-2">
            <label className="text-xs text-vscode-descriptionForeground">Общий доступ к проекту</label>
            <div className="flex items-center gap-2">
              <select className="input" value={shareVisibility} onChange={(e)=>setShareVisibility(e.target.value as Visibility)}>
                <option value="public">public</option>
                <option value="private">private</option>
                <option value="org">org</option>
              </select>
              <button className="btn" onClick={requestShareProject}>Поделиться</button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn" onClick={()=>{ setPage(1); requestList(); }} disabled={loading}>
            {loading ? "Загрузка..." : "Обновить список"}
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button className="btn" onClick={()=>{ if (page>1) { setPage(p=>p-1); requestList(); } }} disabled={page<=1}>Назад</button>
            <div className="text-sm">Стр. {page}</div>
            <button className="btn" onClick={()=>{ setPage(p=>p+1); requestList(); }}>Вперёд</button>
          </div>
        </div>

        {notice && <div className="border border-green-700/40 text-green-500 rounded p-2">{notice}</div>}
        {error && <div className="border border-vscode-errorForeground/40 text-vscode-errorForeground rounded p-2">{error}</div>}

        <div className="grid grid-cols-1 gap-2">
          {files.length === 0 ? (
            <div className="text-sm text-vscode-descriptionForeground">Файлов нет</div>
          ) : (
            files.map((f) => (
              <div key={f.filename + (f.project || "")} className="border rounded p-3 bg-vscode-editorWidget-background flex justify-between items-center">
                <div className="flex flex-col">
                  <div className="font-mono text-sm">{f.filename}</div>
                  {f.project ? <div className="text-xs text-vscode-descriptionForeground">{f.project}</div> : null}
                  {f.public_url ? (
                    <div className="flex items-center gap-2 mt-1">
                      <button className="link text-xs" onClick={() => openPublicUrl(f.public_url)}>Открыть</button>
                      <button className="link text-xs" onClick={() => { navigator.clipboard.writeText(f.public_url!); setNotice('Ссылка скопирована'); }}>Копировать ссылку</button>
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn" onClick={() => requestDownload(f.id || f.filename)}>Скачать</button>
                  <button className="btn" onClick={() => requestDelete(f)}>Удалить</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }, [isAuthorized, files, loading, error, notice, requestList, requestLogout, requestLogin, requestUpload, openPublicUrl, projectName, search, page, pageSize, shareVisibility, virtualKey, virtualKeyId, requestDelete, requestDownload])

  return <div>{body}</div>
}

export default FilesView

// TokenInput удалён для релиза


