import { useEffect, useMemo, useState } from 'react'
import {
  createCropFromName,
  createStageFromName,
  getCropAgeDays,
  getCropStage,
  getCropStageTiming,
  getCropParameters,
  getCropForNode,
  loadActiveCropId,
  loadCropConfiguration,
  loadCropSettings,
  loadNodeAssignments,
  loadRemoteCropConfiguration,
  saveCropConfiguration,
  saveRemoteCropConfiguration,
  isDefaultTomatoStage,
  SENSOR_PARAMETERS,
} from '../lib/cropSettings.js'
import { DashboardNav } from '../components/dashboard/DashboardWidgets.jsx'
import useDashboardData from '../hooks/useDashboardData.js'

export default function ConfiguracionPage({ auth, navigate, route }) {
  const isAdmin = auth.user?.role === 'SUPER_ADMIN'
  const { firebaseNodes } = useDashboardData(auth)
  const [crops, setCrops] = useState(() => loadCropSettings())
  const [activeCropId, setActiveCropId] = useState(() => loadActiveCropId())
  const [selectedCropId, setSelectedCropId] = useState(() => loadActiveCropId())
  const [draftStageId, setDraftStageId] = useState(null)
  const [nodeAssignments, setNodeAssignments] = useState(() => loadNodeAssignments())
  const [newCropName, setNewCropName] = useState('')
  const [newStageName, setNewStageName] = useState('')
  const [newNodeName, setNewNodeName] = useState('')
  const [saveMessage, setSaveMessage] = useState('Cargando configuración...')
  const selectedCrop = useMemo(
    () => crops.find((crop) => crop.id === selectedCropId) ?? crops[0],
    [crops, selectedCropId],
  )
  const selectedStageTiming = getCropStageTiming(selectedCrop)
  const configuredStage = selectedCrop?.stages?.find((stage) => stage.id === selectedCrop?.activeStageId) ?? getCropStage(selectedCrop)
  const selectedStage = selectedCrop?.stages?.find((stage) => stage.id === draftStageId) ?? configuredStage
  const effectiveStage = selectedStageTiming.stage
  const selectedStageIsActive = selectedStage?.id === configuredStage?.id
  const canRemoveSelectedStage = isAdmin && selectedCrop?.stages?.length > 1 && !(selectedCrop?.id === 'jitomate' && isDefaultTomatoStage(selectedStage?.id))
  const selectedCropAgeDays = getCropAgeDays(selectedCrop)
  const selectedParameters = selectedStage?.parameters ?? getCropParameters(selectedCrop)
  const hardwareRows = useMemo(() => {
    const sensorNodes = firebaseNodes
      .filter((node) => node.type === 'sensor' || node.node?.toLowerCase().includes('npk'))
      .map((node) => node.node)
      .filter(Boolean)
    return Array.from(new Set([...nodeAssignments.map((assignment) => assignment.node), ...sensorNodes]))
  }, [firebaseNodes, nodeAssignments])

  useEffect(() => {
    let cancelled = false
    loadRemoteCropConfiguration(auth)
      .then((configuration) => {
        if (cancelled) return
        applyConfiguration(configuration)
        setSaveMessage('Configuración sincronizada con Firebase.')
      })
      .catch(() => {
        if (cancelled) return
        const configuration = loadCropConfiguration()
        applyConfiguration(configuration)
        setSaveMessage('No se pudo leer Firebase; se muestra el respaldo local.')
      })
    return () => {
      cancelled = true
    }
  }, [auth.token])

  useEffect(() => {
    setDraftStageId(selectedCrop?.activeStageId ?? selectedCrop?.stages?.[0]?.id ?? null)
  }, [selectedCrop?.id, selectedCrop?.activeStageId])

  function applyConfiguration(configuration) {
    setCrops(configuration.crops)
    setNodeAssignments(configuration.nodeAssignments)
    setActiveCropId(configuration.activeCropId)
    setSelectedCropId((current) => configuration.crops.some((crop) => crop.id === current) ? current : configuration.activeCropId)
  }

  function persistConfiguration(configuration) {
    const localConfiguration = saveCropConfiguration(configuration)
    applyConfiguration(localConfiguration)
    setSaveMessage('Guardando en Firebase...')
    saveRemoteCropConfiguration(auth, localConfiguration)
      .then((savedConfiguration) => {
        applyConfiguration(savedConfiguration)
        setSaveMessage('Guardado en Firebase.')
      })
      .catch(() => setSaveMessage('Quedó guardado localmente, pero Firebase no respondió.'))
    return localConfiguration
  }

  function persistCrops(nextCrops, nextActiveCropId = activeCropId, nextNodeAssignments = nodeAssignments) {
    return persistConfiguration({
      activeCropId: nextActiveCropId,
      crops: nextCrops,
      nodeAssignments: nextNodeAssignments,
    }).crops
  }

  function persistNodeAssignments(nextAssignments) {
    return persistConfiguration({
      activeCropId,
      crops,
      nodeAssignments: nextAssignments,
    }).nodeAssignments
  }

  function selectActiveCrop(cropId) {
    setSelectedCropId(cropId)
    persistConfiguration({
      activeCropId: cropId,
      crops,
      nodeAssignments,
    })
  }

  function addCrop(event) {
    event.preventDefault()
    if (!newCropName.trim()) return
    const crop = createCropFromName(newCropName)
    persistCrops([...crops, crop])
    setSelectedCropId(crop.id)
    setNewCropName('')
  }

  function addNodeAssignment(event) {
    event.preventDefault()
    if (!newNodeName.trim() || !isAdmin) return
    upsertNodeAssignment(newNodeName.trim(), {
      cropId: selectedCrop?.id ?? crops[0]?.id,
      greenhouse: 'Invernadero 1',
      area: 'Zona de cultivo',
    })
    setNewNodeName('')
  }

  function updateRange(parameterKey, field, value) {
    persistCrops(crops.map((crop) => {
      if (crop.id !== selectedCrop.id) return crop
      const nextStages = crop.stages.map((stage) => {
        if (stage.id !== selectedStage.id) return stage
        return {
          ...stage,
          parameters: {
            ...stage.parameters,
            [parameterKey]: {
              ...(stage.parameters[parameterKey] ?? {}),
              [field]: value,
            },
          },
        }
      })
      return {
        ...crop,
        stages: nextStages,
      }
    }))
  }

  function updateStageField(field, value) {
    if (!selectedCrop || !selectedStage || !isAdmin) return
    persistCrops(crops.map((crop) => {
      if (crop.id !== selectedCrop.id) return crop
      return {
        ...crop,
        stages: crop.stages.map((stage) => (
          stage.id === selectedStage.id ? { ...stage, [field]: value } : stage
        )),
      }
    }))
  }

  function addStage(event) {
    event.preventDefault()
    if (!newStageName.trim() || !selectedCrop || !isAdmin) return
    const stage = createStageFromName(newStageName)
    persistCrops(crops.map((crop) => (
      crop.id === selectedCrop.id
        ? {
            ...crop,
            activeStageId: stage.id,
            activeStageStartedAt: todayLocalDate(),
            stages: [...crop.stages, stage],
          }
        : crop
    )))
    setDraftStageId(stage.id)
    setNewStageName('')
  }

  function removeSelectedStage() {
    if (!selectedCrop || !selectedStage || !canRemoveSelectedStage) return
    const nextStages = selectedCrop.stages.filter((stage) => stage.id !== selectedStage.id)
    const nextActiveStageId = selectedStageIsActive ? nextStages[0]?.id : selectedCrop.activeStageId
    persistCrops(crops.map((crop) => (
      crop.id === selectedCrop.id
        ? {
            ...crop,
            activeStageId: nextActiveStageId,
            activeStageStartedAt: selectedStageIsActive ? todayLocalDate() : crop.activeStageStartedAt,
            stages: nextStages,
          }
        : crop
    )))
    setDraftStageId(nextActiveStageId ?? nextStages[0]?.id ?? null)
  }

  function applySelectedStage() {
    if (!selectedCrop || !selectedStage || !isAdmin) return
    persistCrops(crops.map((crop) => (
      crop.id === selectedCrop.id
        ? { ...crop, activeStageId: selectedStage.id, activeStageStartedAt: todayLocalDate() }
        : crop
    )))
    setSaveMessage(`Etapa aplicada: ${selectedStage.name}. Las lecturas se comparan con estos rangos.`)
  }

  function updateStageStartDate(value) {
    persistCrops(crops.map((crop) => (
      crop.id === selectedCrop.id
        ? { ...crop, activeStageStartedAt: value || todayLocalDate() }
        : crop
    )))
  }

  function updateCropStartDate(value) {
    persistCrops(crops.map((crop) => (
      crop.id === selectedCrop.id
        ? { ...crop, cropStartedAt: value || todayLocalDate() }
        : crop
    )))
  }

  function upsertNodeAssignment(nodeName, changes) {
    const exists = nodeAssignments.some((assignment) => assignment.node.toLowerCase() === nodeName.toLowerCase())
    if (exists) {
      persistNodeAssignments(nodeAssignments.map((assignment) => (
        assignment.node.toLowerCase() === nodeName.toLowerCase()
          ? { ...assignment, ...changes, node: nodeName }
          : assignment
      )))
      return
    }
    const assignedCrop = crops.find((crop) => crop.id === changes.cropId) ?? selectedCrop ?? crops[0]
    persistNodeAssignments([
      ...nodeAssignments,
      {
        node: nodeName,
        cropId: assignedCrop?.id ?? crops[0]?.id ?? 'jitomate',
        activeStageId: assignedCrop?.activeStageId ?? assignedCrop?.stages?.[0]?.id ?? null,
        activeStageStartedAt: todayLocalDate(),
        cropStartedAt: todayLocalDate(),
        greenhouse: 'Invernadero 1',
        area: 'Zona de cultivo',
        ...changes,
      },
    ])
  }

  function removeNodeAssignment(nodeName) {
    if (!isAdmin) return
    persistNodeAssignments(nodeAssignments.filter((assignment) => assignment.node.toLowerCase() !== nodeName.toLowerCase()))
  }

  function getAssignment(nodeName) {
    const fallbackCrop = crops.find((crop) => crop.id === activeCropId) ?? crops[0]
    return nodeAssignments.find((assignment) => assignment.node.toLowerCase() === nodeName.toLowerCase()) ?? {
      node: nodeName,
      cropId: activeCropId,
      activeStageId: fallbackCrop?.activeStageId ?? fallbackCrop?.stages?.[0]?.id ?? null,
      activeStageStartedAt: todayLocalDate(),
      cropStartedAt: todayLocalDate(),
      greenhouse: 'Invernadero 1',
      area: 'Zona de cultivo',
    }
  }

  function updateAssignmentCrop(nodeName, cropId) {
    const nextCrop = crops.find((crop) => crop.id === cropId) ?? crops[0]
    const current = getAssignment(nodeName)
    upsertNodeAssignment(nodeName, {
      cropId,
      activeStageId: nextCrop?.activeStageId ?? nextCrop?.stages?.[0]?.id ?? null,
      activeStageStartedAt: current.activeStageStartedAt || todayLocalDate(),
      cropStartedAt: current.cropStartedAt || todayLocalDate(),
    })
  }

  return (
    <div className="dashboard-shell min-h-screen text-tlali-ink">
      <DashboardNav auth={auth} hasReadings navigate={navigate} route={route} showReport={false} />
      <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-7 lg:px-10 lg:py-7">
        <section className="paper-card px-5 py-6 sm:px-7">
          <p className="eyebrow">Configuración</p>
          <div className="mt-2 grid gap-4 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Cultivos, rangos y nodos</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-tlali-muted sm:text-base">
                Define qué cultivo maneja cada nodo de Firebase y qué rangos debe usar para generar alertas.
              </p>
              <p className="mt-2 text-xs font-semibold text-tlali-jade-dark">{saveMessage}</p>
            </div>
            <div className="rounded-2xl border border-[#e1dbcd] bg-[#fcf8f0] p-4">
              <p className="text-xs font-semibold text-tlali-muted">Cultivo por defecto</p>
              <select className="tlali-input mt-2" onChange={(event) => selectActiveCrop(event.target.value)} value={activeCropId}>
                {crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.name}</option>)}
              </select>
              <p className="mt-2 text-xs text-tlali-muted">Se usa cuando un nodo todavía no tiene asignación propia.</p>
            </div>
          </div>
        </section>

        <section className="mt-4 paper-card overflow-hidden">
          <div className="border-b border-[#e1dbcd] px-4 py-4 sm:px-5">
            <p className="eyebrow">Hardware</p>
            <h2 className="mt-1 text-xl font-bold">Asignación de nodos Firebase</h2>
            <p className="mt-1 max-w-3xl text-sm text-tlali-muted">
              Aquí se define la comparación: cada nodo se liga a un cultivo, invernadero y zona. Las alertas salen de los rangos del cultivo asignado.
            </p>
          </div>
          <div className="overflow-auto">
            <table className="w-full min-w-[1280px] text-left text-xs">
              <thead className="bg-[#f8f3e9] text-[#687169]">
                <tr>
                  <th>Nodo Firebase</th>
                  <th>Cultivo que controla</th>
                  <th>Etapa del nodo</th>
                  <th>Inicio cultivo</th>
                  <th>Inicio etapa</th>
                  <th>Invernadero</th>
                  <th>Zona</th>
                  <th>Comparación</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {hardwareRows.map((nodeName) => {
                  const assignment = getAssignment(nodeName)
                  const crop = crops.find((item) => item.id === assignment.cropId) ?? crops[0]
                  const scheduledCrop = getCropForNode(nodeName, crops, nodeAssignments) ?? crop
                  return (
                    <tr className="border-t border-[#ece6da]" key={nodeName}>
                      <td className="font-semibold">{nodeName}</td>
                      <td>
                        <select
                          className="tlali-input min-w-40"
                          disabled={!isAdmin}
                          onChange={(event) => updateAssignmentCrop(nodeName, event.target.value)}
                          value={assignment.cropId}
                        >
                          {crops.map((cropOption) => <option key={cropOption.id} value={cropOption.id}>{cropOption.name}</option>)}
                        </select>
                      </td>
                      <td>
                        <select
                          className="tlali-input min-w-48"
                          disabled={!isAdmin}
                          onChange={(event) => upsertNodeAssignment(nodeName, { activeStageId: event.target.value, activeStageStartedAt: todayLocalDate() })}
                          value={scheduledCrop?.activeStageId ?? crop?.activeStageId ?? ''}
                        >
                          {crop?.stages?.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
                        </select>
                      </td>
                      <td>
                        <input
                          className="tlali-input min-w-36"
                          disabled={!isAdmin}
                          max={todayLocalDate()}
                          onChange={(event) => upsertNodeAssignment(nodeName, { cropStartedAt: event.target.value || todayLocalDate() })}
                          type="date"
                          value={scheduledCrop?.cropStartedAt || todayLocalDate()}
                        />
                      </td>
                      <td>
                        <input
                          className="tlali-input min-w-36"
                          disabled={!isAdmin}
                          max={todayLocalDate()}
                          onChange={(event) => upsertNodeAssignment(nodeName, { activeStageStartedAt: event.target.value || todayLocalDate() })}
                          type="date"
                          value={scheduledCrop?.activeStageStartedAt || todayLocalDate()}
                        />
                      </td>
                      <td>
                        <input
                          className="tlali-input min-w-40"
                          disabled={!isAdmin}
                          onChange={(event) => upsertNodeAssignment(nodeName, { greenhouse: event.target.value })}
                          value={assignment.greenhouse}
                        />
                      </td>
                      <td>
                        <input
                          className="tlali-input min-w-40"
                          disabled={!isAdmin}
                          onChange={(event) => upsertNodeAssignment(nodeName, { area: event.target.value })}
                          value={assignment.area}
                        />
                      </td>
                      <td className="text-tlali-muted">
                        <span className="font-bold text-tlali-ink">{scheduledCrop?.name ?? 'cultivo'}</span>
                        {scheduledCrop?.activeStageId && <span> · {getCropStage(scheduledCrop)?.name}</span>}
                        <span> · día {getCropAgeDays(scheduledCrop)}</span>
                      </td>
                      <td className="text-right">
                        <button className="secondary-button" disabled={!isAdmin} onClick={() => removeNodeAssignment(nodeName)} type="button">Quitar</button>
                      </td>
                    </tr>
                  )
                })}
                {!hardwareRows.length && (
                  <tr>
                    <td className="py-8 text-center text-tlali-muted" colSpan="9">Aún no hay nodos detectados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {isAdmin && (
            <form className="flex flex-wrap items-end gap-3 border-t border-[#e1dbcd] px-4 py-4 sm:px-5" onSubmit={addNodeAssignment}>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Agregar nodo manualmente
                <input className="tlali-input min-w-64" onChange={(event) => setNewNodeName(event.target.value)} placeholder="Ej. tlali-npk-02" value={newNodeName} />
              </label>
              <button className="primary-button" type="submit">Asignar nodo</button>
            </form>
          )}
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="paper-card p-4 sm:p-5">
            <p className="eyebrow">Cultivos</p>
            <div className="mt-4 grid gap-2">
              {crops.map((crop) => (
                <button
                  className={`rounded-xl border px-4 py-3 text-left transition ${selectedCropId === crop.id ? 'border-tlali-jade-dark bg-[#d8eee7]' : 'border-[#e1dbcd] bg-[#fcf8f0]'}`}
                  key={crop.id}
                  onClick={() => setSelectedCropId(crop.id)}
                  type="button"
                >
                  <span className="block font-bold">{crop.name}</span>
                  <span className="mt-1 block text-xs text-tlali-muted">{crop.id === activeCropId ? 'Cultivo por defecto' : 'Plantilla disponible'}</span>
                </button>
              ))}
            </div>

            {isAdmin ? (
              <form className="mt-5 border-t border-tlali-line pt-5" onSubmit={addCrop}>
                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  Nuevo cultivo
                  <input className="tlali-input" onChange={(event) => setNewCropName(event.target.value)} placeholder="Ej. Pepino" value={newCropName} />
                </label>
                <button className="primary-button mt-3 w-full" type="submit">Crear cultivo</button>
              </form>
            ) : (
              <p className="mt-5 rounded-xl border border-[#ead5a8] bg-[#fff5dc] p-3 text-sm text-[#75501d]">
                Tu usuario puede elegir cultivo por defecto, pero los rangos los modifica un administrador.
              </p>
            )}
          </aside>

          <article className="paper-card overflow-hidden">
            <div className="border-b border-[#e1dbcd] px-4 py-4 sm:px-5">
              <p className="eyebrow">Parámetros</p>
              <h2 className="mt-1 text-xl font-bold">{selectedCrop?.name ?? 'Cultivo'}</h2>
              <p className="mt-1 text-sm text-tlali-muted">{selectedCrop?.description}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                {selectedCrop?.stages?.map((stage) => (
                  <button
                    className={`min-h-[112px] rounded-xl border px-3 py-3 text-left transition ${selectedStage?.id === stage.id ? 'border-tlali-jade-dark bg-[#d8eee7]' : 'border-[#e1dbcd] bg-[#fcf8f0]'}`}
                    disabled={!isAdmin}
                    key={stage.id}
                    onClick={() => setDraftStageId(stage.id)}
                    type="button"
                  >
                    <span className="block text-sm font-black">{stage.name}</span>
                    <span className="mt-2 block text-xs font-bold text-[#4f6258]">{stage.durationDays} días</span>
                    <span className="mt-1 block text-xs leading-5 text-tlali-muted">{stage.from} → {stage.to}</span>
                    {configuredStage?.id === stage.id && (
                      <span className="mt-2 inline-flex rounded-full bg-tlali-jade-dark px-2 py-1 text-[10px] font-black uppercase text-white">Activa</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e1dbcd] bg-[#fcf8f0] px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-[#687169]">
                    Etapa activa para alertas: <span className="text-tlali-ink">{configuredStage?.name}</span>
                    {effectiveStage?.id !== configuredStage?.id && <span> · por calendario usa {effectiveStage?.name}</span>}
                  </p>
                  <p className="mt-1 text-xs text-tlali-muted">
                    En edición: <span className="font-bold text-tlali-ink">{selectedStage?.name}</span>. Al aplicar, los sensores se comparan contra sus rangos mínimo/máximo.
                  </p>
                </div>
                {isAdmin && (
                  <button className="primary-button min-h-11" disabled={!selectedStage} onClick={applySelectedStage} type="button">
                    {selectedStageIsActive ? 'Reaplicar rangos' : 'Aplicar etapa y rangos'}
                  </button>
                )}
              </div>
              <div className="mt-3 grid gap-3 rounded-xl border border-[#e1dbcd] bg-[#fcf8f0] px-4 py-3 lg:grid-cols-[220px_220px_1fr] lg:items-end">
                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  Inicio del cultivo
                  <input
                    className="tlali-input"
                    disabled={!isAdmin}
                    max={todayLocalDate()}
                    onChange={(event) => updateCropStartDate(event.target.value)}
                    type="date"
                    value={selectedCrop?.cropStartedAt ?? todayLocalDate()}
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  Inicio de etapa
                  <input
                    className="tlali-input"
                    disabled={!isAdmin}
                    max={todayLocalDate()}
                    onChange={(event) => updateStageStartDate(event.target.value)}
                    type="date"
                    value={selectedCrop?.activeStageStartedAt ?? todayLocalDate()}
                  />
                </label>
                <div className="grid gap-2 sm:grid-cols-4">
                  <StageCounter label="Edad del cultivo" value={selectedCropAgeDays} />
                  <StageCounter label="Desde inicio de etapa" value={selectedStageTiming.totalDaysElapsed} />
                  <StageCounter label="En etapa calculada" value={selectedStageTiming.daysElapsed} />
                  <StageCounter label="Límite de etapa" value={selectedStageTiming.maxDays} />
                </div>
              </div>
              {selectedStageTiming.isAutoAdvanced && (
                <div className="mt-3 rounded-xl border border-[#ead5a8] bg-[#fff5dc] px-4 py-3 text-sm text-[#75501d]">
                  El calendario ya avanzó desde {selectedStageTiming.configuredStage.name} hacia {selectedStageTiming.stage.name}. Los rangos y alertas usan la etapa actual calculada.
                </div>
              )}
              {isAdmin && selectedStage && (
                <div className="mt-3 grid gap-3 rounded-xl border border-[#e1dbcd] bg-[#fcf8f0] px-4 py-4 lg:grid-cols-2">
                  <label className="grid gap-1 text-sm font-semibold text-slate-700">
                    Nombre de etapa
                    <input className="tlali-input" onChange={(event) => updateStageField('name', event.target.value)} value={selectedStage.name} />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold text-slate-700">
                    Días de duración
                    <input className="tlali-input" onChange={(event) => updateStageField('durationDays', event.target.value)} placeholder="Ej. 30-45" value={selectedStage.durationDays} />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold text-slate-700">
                    Desde
                    <input className="tlali-input" onChange={(event) => updateStageField('from', event.target.value)} value={selectedStage.from} />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold text-slate-700">
                    Hasta
                    <input className="tlali-input" onChange={(event) => updateStageField('to', event.target.value)} value={selectedStage.to} />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold text-slate-700 lg:col-span-2">
                    Descripción
                    <textarea className="tlali-input min-h-20" onChange={(event) => updateStageField('description', event.target.value)} value={selectedStage.description} />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold text-slate-700 lg:col-span-2">
                    Cuidados recomendados
                    <textarea className="tlali-input min-h-24" onChange={(event) => updateStageField('guidance', event.target.value)} value={selectedStage.guidance} />
                  </label>
                  <div className="flex flex-wrap gap-3 lg:col-span-2">
                    <form className="flex flex-1 flex-wrap items-end gap-3" onSubmit={addStage}>
                      <label className="grid min-w-64 flex-1 gap-1 text-sm font-semibold text-slate-700">
                        Nueva etapa
                        <input className="tlali-input" onChange={(event) => setNewStageName(event.target.value)} placeholder="Ej. Trasplante" value={newStageName} />
                      </label>
                      <button className="primary-button" type="submit">Registrar etapa</button>
                    </form>
                    <button className="secondary-button self-end" disabled={!canRemoveSelectedStage} onClick={removeSelectedStage} type="button">Quitar etapa</button>
                  </div>
                </div>
              )}
              {selectedStage?.guidance && (
                <div className="mt-3 rounded-xl border border-[#e1dbcd] bg-[#fcf8f0] px-4 py-3">
                  <p className="text-xs font-black uppercase text-[#687169]">Manejo recomendado</p>
                  <p className="mt-2 text-sm leading-6 text-tlali-muted">{selectedStage.guidance}</p>
                </div>
              )}
            </div>
            <div className="overflow-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-[#f8f3e9] text-[#687169]">
                  <tr>
                    <th>Sensor</th>
                    <th>Unidad</th>
                    <th>Mínimo</th>
                    <th>Máximo</th>
                  </tr>
                </thead>
                <tbody>
                  {SENSOR_PARAMETERS.map((parameter) => {
                    const range = selectedParameters?.[parameter.key] ?? { min: parameter.min, max: parameter.max }
                    return (
                      <tr className="border-t border-[#ece6da]" key={parameter.key}>
                        <td className="font-semibold">{parameter.label}</td>
                        <td>{parameter.unit}</td>
                        <td>
                          <input
                            className="tlali-input max-w-32"
                            disabled={!isAdmin}
                            onChange={(event) => updateRange(parameter.key, 'min', event.target.value)}
                            step="any"
                            type="number"
                            value={range.min}
                          />
                        </td>
                        <td>
                          <input
                            className="tlali-input max-w-32"
                            disabled={!isAdmin}
                            onChange={(event) => updateRange(parameter.key, 'max', event.target.value)}
                            step="any"
                            type="number"
                            value={range.max}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </div>
    </div>
  )
}

function StageCounter({ label, value }) {
  return (
    <div className="rounded-xl border border-[#e1dbcd] bg-white px-3 py-2">
      <p className="text-[10px] font-bold uppercase text-tlali-muted">{label}</p>
      <p className="mt-1 text-2xl font-black text-tlali-jade-dark">{value}</p>
    </div>
  )
}

function todayLocalDate() {
  return new Date().toLocaleDateString('en-CA')
}
