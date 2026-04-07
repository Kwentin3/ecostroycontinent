"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import styles from "./admin-ui.module.css";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function buildEditedFilename(filename, fallbackExtension = ".png") {
  if (!filename) {
    return `media-edited${fallbackExtension}`;
  }

  const extensionMatch = /\.[^.]+$/.exec(filename);
  const extension = extensionMatch?.[0] || fallbackExtension;
  const base = filename.replace(/\.[^.]+$/, "");
  return `${base}${extension}`;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Не удалось загрузить изображение для редактирования."));
    image.src = url;
  });
}

async function canvasToFile(canvas, mimeType, filename) {
  const blob = await new Promise((resolve) => {
    canvas.toBlob((nextBlob) => resolve(nextBlob), mimeType || "image/png");
  });

  if (!blob) {
    throw new Error("Не удалось подготовить бинарник после редактирования.");
  }

  return new File([blob], buildEditedFilename(filename, mimeType === "image/jpeg" ? ".jpg" : ".png"), {
    type: blob.type || mimeType || "image/png"
  });
}

async function applyCanvasTransform(sourceUrl, filename, mimeType, transform) {
  const image = await loadImage(sourceUrl);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas-редактор недоступен в этом браузере.");
  }

  const { type } = transform;

  if (type === "rotate") {
    const angle = transform.angle;
    const quarterTurn = Math.abs(angle) % 180 === 90;
    canvas.width = quarterTurn ? image.naturalHeight : image.naturalWidth;
    canvas.height = quarterTurn ? image.naturalWidth : image.naturalHeight;

    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((angle * Math.PI) / 180);
    context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
    return canvasToFile(canvas, mimeType, filename);
  }

  if (type === "flip") {
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    context.translate(transform.axis === "horizontal" ? canvas.width : 0, transform.axis === "vertical" ? canvas.height : 0);
    context.scale(transform.axis === "horizontal" ? -1 : 1, transform.axis === "vertical" ? -1 : 1);
    context.drawImage(image, 0, 0);
    return canvasToFile(canvas, mimeType, filename);
  }

  if (type === "crop") {
    const crop = transform.crop;
    canvas.width = Math.max(1, Math.round(crop.width));
    canvas.height = Math.max(1, Math.round(crop.height));
    context.drawImage(
      image,
      crop.left,
      crop.top,
      crop.width,
      crop.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
    return canvasToFile(canvas, mimeType, filename);
  }

  throw new Error("Неизвестная операция редактирования изображения.");
}

export function MediaImageEditorPanel({
  sourceUrl,
  filename,
  mimeType,
  disabledReason,
  busy,
  hasEdits,
  onCommit,
  onReset
}) {
  const surfaceRef = useRef(null);
  const [selection, setSelection] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [editorBusy, setEditorBusy] = useState(false);
  const [editorError, setEditorError] = useState("");

  const canEdit = Boolean(sourceUrl) && !disabledReason && !busy;

  useEffect(() => {
    if (!dragState) {
      return undefined;
    }

    function handlePointerMove(event) {
      const rect = surfaceRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      const currentX = clamp(event.clientX - rect.left, 0, rect.width);
      const currentY = clamp(event.clientY - rect.top, 0, rect.height);
      const left = Math.min(dragState.startX, currentX);
      const top = Math.min(dragState.startY, currentY);
      const width = Math.abs(currentX - dragState.startX);
      const height = Math.abs(currentY - dragState.startY);

      setSelection({
        left,
        top,
        width,
        height
      });
    }

    function handlePointerUp() {
      setDragState(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragState]);

  useEffect(() => {
    setSelection(null);
    setEditorError("");
    setDragState(null);
  }, [sourceUrl]);

  const canCrop = useMemo(() => {
    return Boolean(selection && selection.width > 8 && selection.height > 8 && canEdit);
  }, [selection, canEdit]);

  async function runTransform(transform) {
    if (!sourceUrl || !canEdit) {
      return;
    }

    setEditorBusy(true);
    setEditorError("");

    try {
      const nextFile = await applyCanvasTransform(sourceUrl, filename, mimeType, transform);
      const nextUrl = URL.createObjectURL(nextFile);
      onCommit(nextFile, nextUrl);
      setSelection(null);
    } catch (error) {
      setEditorError(error.message || "Не удалось применить редактирование.");
    } finally {
      setEditorBusy(false);
    }
  }

  async function handleCrop() {
    const rect = surfaceRef.current?.getBoundingClientRect();
    const imageElement = surfaceRef.current?.querySelector("img");

    if (!rect || !imageElement || !selection || !canCrop) {
      return;
    }

    const naturalWidth = imageElement.naturalWidth;
    const naturalHeight = imageElement.naturalHeight;
    const crop = {
      left: Math.round((selection.left / rect.width) * naturalWidth),
      top: Math.round((selection.top / rect.height) * naturalHeight),
      width: Math.round((selection.width / rect.width) * naturalWidth),
      height: Math.round((selection.height / rect.height) * naturalHeight)
    };

    await runTransform({ type: "crop", crop });
  }

  function handlePointerDown(event) {
    if (!canEdit || editorBusy) {
      return;
    }

    const rect = surfaceRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const startX = clamp(event.clientX - rect.left, 0, rect.width);
    const startY = clamp(event.clientY - rect.top, 0, rect.height);

    setSelection({
      left: startX,
      top: startY,
      width: 0,
      height: 0
    });
    setDragState({ startX, startY });
  }

  return (
    <div className={styles.mediaImageEditor}>
      <div className={styles.mediaImageEditorToolbar}>
        <div className={styles.inlineActions}>
          <button type="button" className={styles.secondaryButton} onClick={() => runTransform({ type: "rotate", angle: -90 })} disabled={!canEdit || editorBusy}>
            Повернуть влево
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => runTransform({ type: "rotate", angle: 90 })} disabled={!canEdit || editorBusy}>
            Повернуть вправо
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => runTransform({ type: "flip", axis: "horizontal" })} disabled={!canEdit || editorBusy}>
            Отразить по горизонтали
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => runTransform({ type: "flip", axis: "vertical" })} disabled={!canEdit || editorBusy}>
            Отразить по вертикали
          </button>
          <button type="button" className={styles.secondaryButton} onClick={handleCrop} disabled={!canCrop || editorBusy}>
            Применить кадрирование
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onReset} disabled={!hasEdits || editorBusy}>
            Сбросить
          </button>
        </div>
        <p className={styles.helpText}>
          Следующая версия редактора поддерживает только безопасные правки черновика. Здесь можно повернуть, отразить и обрезать изображение без смены сценария вариантов.
        </p>
      </div>

      {editorError ? <div className={styles.statusPanelBlocking}>{editorError}</div> : null}

      {!sourceUrl ? (
        <div className={styles.mediaImageEditorEmpty}>
          <p>Сначала выберите изображение.</p>
          <p className={styles.helpText}>После выбора файла откроется предпросмотр, и здесь появятся инструменты правки.</p>
        </div>
      ) : disabledReason ? (
        <div className={styles.mediaImageEditorEmpty}>
          <p>Правка изображения сейчас недоступна.</p>
          <p className={styles.helpText}>{disabledReason}</p>
        </div>
      ) : (
        <div className={styles.mediaImageEditorStageWrap}>
          <div
            ref={surfaceRef}
            className={styles.mediaImageEditorStage}
            onPointerDown={handlePointerDown}
            role="presentation"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sourceUrl} alt={filename || "Редактируемое изображение"} />
            {selection ? (
              <span
                className={styles.mediaImageEditorSelection}
                style={{
                  left: `${selection.left}px`,
                  top: `${selection.top}px`,
                  width: `${selection.width}px`,
                  height: `${selection.height}px`
                }}
              />
            ) : null}
          </div>
          <p className={styles.helpText}>
            Потяните мышью по изображению, чтобы выделить область кадрирования. После этого нажмите `Применить кадрирование`.
          </p>
        </div>
      )}
    </div>
  );
}
