import { FilterableChecklist } from "./FilterableChecklist";
import { MediaPicker } from "./MediaPicker";
import { FIELD_HINTS } from "../../lib/admin/screen-copy.js";
import { FIELD_LABELS } from "../../lib/ui-copy.js";
import styles from "./admin-ui.module.css";

function TruthGroup({ id, title, note, children }) {
  return (
    <section id={id} className={`${styles.panel} ${styles.panelMuted} ${styles.editorTruthSection} ${styles.anchorTarget}`}>
      <div className={styles.editorTruthSectionHeader}>
        <p className={styles.cockpitBlockKicker}>Поисковая оптимизация / данные</p>
        <h3 className={styles.editorTruthSectionTitle}>{title}</h3>
        {note ? <p className={styles.editorTruthSectionNote}>{note}</p> : null}
      </div>
      <div className={styles.formGrid}>{children}</div>
    </section>
  );
}

function SeoMetaFields({ value }) {
  return (
    <>
      <label className={styles.label}>
        <span>{FIELD_LABELS.metaTitle}</span>
        <input name="metaTitle" defaultValue={value.seo?.metaTitle || ""} />
      </label>
      <label className={styles.label}>
        <span>{FIELD_LABELS.metaDescription}</span>
        <textarea name="metaDescription" defaultValue={value.seo?.metaDescription || ""} />
      </label>
      <label className={styles.label}>
        <span>{FIELD_LABELS.canonicalIntent}</span>
        <input name="canonicalIntent" defaultValue={value.seo?.canonicalIntent || ""} />
        <p className={styles.helpText}>{FIELD_HINTS.canonicalIntent}</p>
      </label>
      <label className={styles.label}>
        <span>{FIELD_LABELS.indexationFlag}</span>
        <select name="indexationFlag" defaultValue={value.seo?.indexationFlag || "index"}>
          <option value="index">Индексировать</option>
          <option value="noindex">Не индексировать</option>
        </select>
      </label>
      <label className={styles.label}>
        <span>{FIELD_LABELS.openGraphTitle}</span>
        <input name="openGraphTitle" defaultValue={value.seo?.openGraphTitle || ""} />
      </label>
      <label className={styles.label}>
        <span>{FIELD_LABELS.openGraphDescription}</span>
        <textarea name="openGraphDescription" defaultValue={value.seo?.openGraphDescription || ""} />
      </label>
      <input type="hidden" name="openGraphImageAssetId" value={value.seo?.openGraphImageAssetId || ""} />
    </>
  );
}

export function EntityTruthSections({
  entityType,
  value,
  relationOptions,
  mediaOptions,
  caseProjectTypeOptions = [],
  sourceHref = ""
}) {
  if (entityType === "global_settings") {
    return (
      <>
        <TruthGroup id="global-settings-brand-truth" title="Брендовые данные" note="Это публичное имя и юридическая основа карточки.">
          <div className={styles.gridTwo}>
            <label className={styles.label}>
              <span>{FIELD_LABELS.publicBrandName}</span>
              <input name="publicBrandName" defaultValue={value.publicBrandName || ""} required />
            </label>
            <label className={styles.label}>
              <span>{FIELD_LABELS.legalName}</span>
              <input name="legalName" defaultValue={value.legalName || ""} required />
            </label>
          </div>
        </TruthGroup>

        <TruthGroup id="global-settings-contact-truth" title="Контактные данные" note="Контакты должны быть подтверждены до публикации.">
          <div className={styles.gridTwo}>
            <label className={styles.label}>
              <span>{FIELD_LABELS.primaryPhone}</span>
              <input name="primaryPhone" defaultValue={value.primaryPhone || ""} />
            </label>
            <label className={styles.label}>
              <span>Активный мессенджер</span>
              <select name="activeMessengers" defaultValue={value.activeMessengers?.[0] || ""}>
                <option value="">Нет</option>
                <option value="telegram">Telegram</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </label>
            <label className={styles.label}>
              <span>{FIELD_LABELS.publicEmail}</span>
              <input name="publicEmail" defaultValue={value.publicEmail || ""} />
            </label>
            <label className={styles.label}>
              <span>{FIELD_LABELS.contactTruthConfirmed}</span>
              <input type="checkbox" name="contactTruthConfirmed" defaultChecked={Boolean(value.contactTruthConfirmed)} />
            </label>
          </div>
        </TruthGroup>

        <TruthGroup id="global-settings-service-area" title="Зона обслуживания" note="Эти поля помогают оператору и поиску понимать географию.">
          <div className={styles.gridTwo}>
            <label className={styles.label}>
              <span>{FIELD_LABELS.serviceArea}</span>
              <input name="serviceArea" defaultValue={value.serviceArea || ""} />
            </label>
            <label className={styles.label}>
              <span>{FIELD_LABELS.primaryRegion}</span>
              <input name="primaryRegion" defaultValue={value.primaryRegion || ""} />
            </label>
          </div>
        </TruthGroup>

        <TruthGroup id="global-settings-default-cta" title="Кнопка по умолчанию" note="Кнопка и пояснение подставляются в карточки по умолчанию.">
          <div className={styles.gridTwo}>
            <label className={styles.label}>
              <span>{FIELD_LABELS.defaultCtaLabel}</span>
              <input name="defaultCtaLabel" defaultValue={value.defaultCtaLabel || ""} />
            </label>
            <label className={styles.label}>
              <span>{FIELD_LABELS.defaultCtaDescription}</span>
              <textarea name="defaultCtaDescription" defaultValue={value.defaultCtaDescription || ""} />
            </label>
          </div>
        </TruthGroup>

        <TruthGroup id="global-settings-organization" title="Организация" note="Дополнительные сведения о компании.">
          <div className={styles.gridTwo}>
            <label className={styles.label}>
              <span>{FIELD_LABELS.organizationCity}</span>
              <input name="organizationCity" defaultValue={value.organization?.city || ""} />
            </label>
            <label className={styles.label}>
              <span>{FIELD_LABELS.organizationCountry}</span>
              <input name="organizationCountry" defaultValue={value.organization?.country || ""} />
            </label>
          </div>
        </TruthGroup>

        <TruthGroup id="global-settings-seo-meta" title="Поисковая оптимизация / метаданные" note="Здесь редактируются метаданные карточки и поля, которые помогают поиску и предпросмотру.">
          <SeoMetaFields value={value} />
        </TruthGroup>
      </>
    );
  }

  if (entityType === "service") {
    return (
      <>
        <TruthGroup id="service-seo-truth" title="Данные услуги" note="Это базовые данные услуги и её видимый заголовок.">
          <div className={styles.gridTwo}>
            <label className={styles.label}>
              <span>{FIELD_LABELS.slug}</span>
              <input name="slug" defaultValue={value.slug || ""} required />
            </label>
            <label className={styles.label}>
              <span>Название</span>
              <input name="title" defaultValue={value.title || ""} required />
            </label>
            <label className={styles.label}>
              <span>{FIELD_LABELS.h1}</span>
              <input name="h1" defaultValue={value.h1 || ""} required />
            </label>
            <label className={styles.label}>
              <span>{FIELD_LABELS.summary}</span>
              <textarea name="summary" defaultValue={value.summary || ""} required />
            </label>
          </div>
        </TruthGroup>

        <TruthGroup id="service-core" title="Суть услуги" note="Что входит в услугу и какие задачи она закрывает.">
          <label className={styles.label}>
            <span>{FIELD_LABELS.serviceScope}</span>
            <textarea name="serviceScope" defaultValue={value.serviceScope || ""} required />
          </label>
          <label className={styles.label}>
            <span>{FIELD_LABELS.problemsSolved}</span>
            <textarea name="problemsSolved" defaultValue={value.problemsSolved || ""} />
          </label>
          <label className={styles.label}>
            <span>{FIELD_LABELS.methods}</span>
            <textarea name="methods" defaultValue={value.methods || ""} />
          </label>
        </TruthGroup>

        <TruthGroup id="service-cta" title="Кнопка действия" note="Здесь задаётся основной призыв к действию для услуги.">
          <label className={styles.label}>
            <span>{FIELD_LABELS.ctaVariant}</span>
            <input name="ctaVariant" defaultValue={value.ctaVariant || ""} required />
          </label>
        </TruthGroup>

        <TruthGroup id="service-relations" title="Связи" note="Связанные кейсы и галереи делают карточку собранной.">
          <FilterableChecklist
            legend="Связанные кейсы"
            name="relatedCaseIds"
            options={relationOptions.cases}
            selectedIds={value.relatedCaseIds || []}
            entityType="case"
            sourceHref={sourceHref}
          />
          <FilterableChecklist
            legend="Коллекции"
            name="galleryIds"
            options={relationOptions.galleries}
            selectedIds={value.galleryIds || []}
            entityType="gallery"
            sourceHref={sourceHref}
          />
        </TruthGroup>

        <TruthGroup id="service-media" title="Медиа" note="Основной кадр поддерживает предпросмотр и карточку услуги.">
          <MediaPicker
            legend="Основное медиа"
            name="primaryMediaAssetId"
            assets={mediaOptions}
            selectedIds={value.primaryMediaAssetId ? [value.primaryMediaAssetId] : []}
            hint={FIELD_HINTS.primaryMedia}
            sourceHref={sourceHref}
          />
        </TruthGroup>

        <TruthGroup id="service-seo-meta" title="Поисковая оптимизация / метаданные" note="Здесь редактируются метаданные карточки услуги и её предпросмотр.">
          <SeoMetaFields value={value} />
        </TruthGroup>
      </>
    );
  }

  if (entityType === "equipment") {
    return (
      <>
        <TruthGroup id="equipment-seo-truth" title="Данные техники" note="Это базовая карточка техники, которая потом может стать источником для страницы.">
          <div className={styles.gridTwo}>
            <label className={styles.label}>
              <span>Короткий адрес</span>
              <input name="slug" defaultValue={value.slug || ""} required />
            </label>
            <label className={styles.label}>
              <span>Локаль</span>
              <input name="locale" defaultValue={value.locale || "ru-RU"} required />
            </label>
            <label className={styles.label}>
              <span>Название</span>
              <input name="title" defaultValue={value.title || ""} required />
            </label>
            <label className={styles.label}>
              <span>Тип техники</span>
              <input name="equipmentType" defaultValue={value.equipmentType || ""} required />
            </label>
          </div>
        </TruthGroup>

        <TruthGroup id="equipment-core" title="Коммерческое описание" note="Карточка должна объяснять, что это за техника и для каких задач она подходит.">
          <label className={styles.label}>
            <span>Краткое описание</span>
            <textarea name="shortSummary" defaultValue={value.shortSummary || ""} required />
          </label>
          <label className={styles.label}>
            <span>Что техника умеет</span>
            <textarea name="capabilitySummary" defaultValue={value.capabilitySummary || ""} required />
          </label>
          <label className={styles.label}>
            <span>Режим работы</span>
            <input name="operatorMode" defaultValue={value.operatorMode || ""} placeholder="Например, с оператором" />
          </label>
        </TruthGroup>

        <TruthGroup id="equipment-specs" title="Характеристики и сценарии" note="Это базовый доказательный слой для посадок по технике.">
          <label className={styles.label}>
            <span>Характеристики</span>
            <textarea name="keySpecs" defaultValue={(value.keySpecs || []).join("\n")} placeholder="Каждая характеристика с новой строки" />
            <p className={styles.helpText}>Каждая строка станет отдельной характеристикой.</p>
          </label>
          <label className={styles.label}>
            <span>Сценарии применения</span>
            <textarea name="usageScenarios" defaultValue={(value.usageScenarios || []).join("\n")} placeholder="Каждый сценарий с новой строки" />
            <p className={styles.helpText}>Каждая строка станет отдельным сценарием применения.</p>
          </label>
        </TruthGroup>

        <TruthGroup id="equipment-relations" title="Связи" note="Техника может быть связана с услугами, кейсами и коллекциями без копирования truth в текст страницы.">
          <FilterableChecklist
            legend="Связанные услуги"
            name="serviceIds"
            options={relationOptions.services}
            selectedIds={value.serviceIds || []}
            entityType="service"
            sourceHref={sourceHref}
          />
          <FilterableChecklist
            legend="Связанные кейсы"
            name="relatedCaseIds"
            options={relationOptions.cases}
            selectedIds={value.relatedCaseIds || []}
            entityType="case"
            sourceHref={sourceHref}
          />
          <FilterableChecklist
            legend="Коллекции"
            name="galleryIds"
            options={relationOptions.galleries}
            selectedIds={value.galleryIds || []}
            entityType="gallery"
            sourceHref={sourceHref}
          />
        </TruthGroup>

        <TruthGroup id="equipment-media" title="Медиа" note="Основной кадр используется в карточке техники и в посадках, если его не переопределили на странице.">
          <MediaPicker
            legend="Основное медиа"
            name="primaryMediaAssetId"
            assets={mediaOptions}
            selectedIds={value.primaryMediaAssetId ? [value.primaryMediaAssetId] : []}
            hint={FIELD_HINTS.primaryMedia}
            sourceHref={sourceHref}
          />
        </TruthGroup>

        <TruthGroup id="equipment-seo-meta" title="Поисковая оптимизация / метаданные" note="Метаданные карточки техники живут отдельно от страницы.">
          <SeoMetaFields value={value} />
        </TruthGroup>
      </>
    );
  }

  if (entityType === "case") {
    return (
      <>
        <TruthGroup id="case-seo-truth" title="Данные кейса" note="Это базовые данные кейса и его видимый заголовок.">
          <div className={styles.gridTwo}>
            <label className={styles.label}>
              <span>{FIELD_LABELS.slug}</span>
              <input name="slug" defaultValue={value.slug || ""} required />
            </label>
            <label className={styles.label}>
              <span>Название</span>
              <input name="title" defaultValue={value.title || ""} required />
            </label>
            <label className={styles.label}>
              <span>{FIELD_LABELS.location}</span>
              <input name="location" defaultValue={value.location || ""} required />
            </label>
            <label className={styles.label}>
              <span>{FIELD_LABELS.projectType}</span>
              <input name="projectType" list={caseProjectTypeOptions.length ? "caseProjectTypeOptions" : undefined} defaultValue={value.projectType || ""} />
              <p className={styles.helpText}>{FIELD_HINTS.projectType}</p>
            </label>
          </div>
          {caseProjectTypeOptions.length ? (
            <datalist id="caseProjectTypeOptions">
              {caseProjectTypeOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          ) : null}
        </TruthGroup>

        <TruthGroup id="case-core" title="Суть кейса" note="Задача, объём и результат должны быть понятны без догадок.">
          <label className={styles.label}>
            <span>{FIELD_LABELS.task}</span>
            <textarea name="task" defaultValue={value.task || ""} required />
          </label>
          <label className={styles.label}>
            <span>{FIELD_LABELS.workScope}</span>
            <textarea name="workScope" defaultValue={value.workScope || ""} required />
          </label>
          <label className={styles.label}>
            <span>{FIELD_LABELS.result}</span>
            <textarea name="result" defaultValue={value.result || ""} required />
          </label>
        </TruthGroup>

        <TruthGroup id="case-relations" title="Связи" note="Кейсу нужны связанные услуги и коллекции, чтобы он был контекстным.">
          <FilterableChecklist
            legend="Связанные услуги"
            name="serviceIds"
            options={relationOptions.services}
            selectedIds={value.serviceIds || []}
            entityType="service"
            sourceHref={sourceHref}
          />
          <FilterableChecklist
            legend="Коллекции"
            name="galleryIds"
            options={relationOptions.galleries}
            selectedIds={value.galleryIds || []}
            entityType="gallery"
            sourceHref={sourceHref}
          />
        </TruthGroup>

        <TruthGroup id="case-media" title="Медиа" note="Основной кадр помогает предпросмотру и карточке кейса.">
          <MediaPicker
            legend="Основное медиа"
            name="primaryMediaAssetId"
            assets={mediaOptions}
            selectedIds={value.primaryMediaAssetId ? [value.primaryMediaAssetId] : []}
            hint={FIELD_HINTS.primaryMedia}
            sourceHref={sourceHref}
          />
        </TruthGroup>

        <TruthGroup id="case-seo-meta" title="Поисковая оптимизация / метаданные" note="Здесь редактируются метаданные карточки кейса и её предпросмотр.">
          <SeoMetaFields value={value} />
        </TruthGroup>
      </>
    );
  }

  if (entityType === "page") {
    return (
      <>
        <TruthGroup id="page-route-truth" title="Маршрут" note="Канонический адрес и тип страницы должны быть ясными.">
          <div className={styles.gridTwo}>
            <label className={styles.label}>
              <span>{FIELD_LABELS.slug}</span>
              <input name="slug" defaultValue={value.slug || ""} required />
            </label>
            <label className={styles.label}>
              <span>Тип страницы</span>
              <select name="pageType" defaultValue={value.pageType || "about"}>
                <option value="about">О нас</option>
                <option value="contacts">Контакты</option>
              </select>
            </label>
          </div>
        </TruthGroup>

        <TruthGroup id="page-seo-truth" title="Поисковая оптимизация / заголовки" note="Заголовок страницы и H1 должны совпадать с операторским замыслом.">
          <div className={styles.gridTwo}>
            <label className={styles.label}>
              <span>Название</span>
              <input name="title" defaultValue={value.title || ""} required />
            </label>
            <label className={styles.label}>
              <span>{FIELD_LABELS.h1}</span>
              <input name="h1" defaultValue={value.h1 || ""} required />
            </label>
          </div>
          <label className={styles.label}>
            <span>{FIELD_LABELS.intro}</span>
            <textarea name="intro" defaultValue={value.intro || ""} />
          </label>
        </TruthGroup>

        <TruthGroup id="page-content" title="Содержание и блоки" note="Здесь собираются основные блоки страницы, заметка по контактам и кнопка действия.">
          <label className={styles.label}>
            <span>{FIELD_LABELS.blocks}</span>
            <textarea name="body" defaultValue={value.body || ""} />
          </label>
          <label className={styles.label}>
            <span>Примечание по контактам</span>
            <textarea name="contactNote" defaultValue={value.contactNote || ""} />
          </label>
          <label className={styles.label}>
            <span>Заголовок кнопки</span>
            <input name="ctaTitle" defaultValue={value.ctaTitle || ""} />
          </label>
          <label className={styles.label}>
            <span>Текст кнопки</span>
            <textarea name="ctaBody" defaultValue={value.ctaBody || ""} />
          </label>
          <label className={styles.label}>
            <span>{FIELD_LABELS.defaultBlockCtaLabel}</span>
            <input name="defaultBlockCtaLabel" defaultValue={value.defaultBlockCtaLabel || ""} />
          </label>
        </TruthGroup>

        <TruthGroup id="page-relations" title="Связи" note="Страница может подтягивать связанные услуги, кейсы и галереи.">
          <FilterableChecklist
            legend="Связанные услуги"
            name="serviceIds"
            options={relationOptions.services}
            selectedIds={value.serviceIds || []}
            entityType="service"
            sourceHref={sourceHref}
          />
          <FilterableChecklist
            legend="Связанные кейсы"
            name="caseIds"
            options={relationOptions.cases}
            selectedIds={value.caseIds || []}
            entityType="case"
            sourceHref={sourceHref}
          />
          <FilterableChecklist
            legend="Коллекции"
            name="galleryIds"
            options={relationOptions.galleries}
            selectedIds={value.galleryIds || []}
            entityType="gallery"
            sourceHref={sourceHref}
          />
        </TruthGroup>

        <TruthGroup id="page-media" title="Медиа" note="Основное медиа используется как предпросмотр и главный кадр.">
          <MediaPicker
            legend="Основное медиа"
            name="primaryMediaAssetId"
            assets={mediaOptions}
            selectedIds={value.primaryMediaAssetId ? [value.primaryMediaAssetId] : []}
            hint={FIELD_HINTS.primaryMedia}
            sourceHref={sourceHref}
          />
        </TruthGroup>

        <TruthGroup id="page-seo-meta" title="Поисковая оптимизация / метаданные" note="Здесь редактируются метаданные карточки страницы и её предпросмотр.">
          <SeoMetaFields value={value} />
        </TruthGroup>
      </>
    );
  }

  return null;
}
