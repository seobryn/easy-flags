import { useEffect, useState } from "react";
import PageContainer from "@/components/react/shared/PageContainer";
import { Modal } from "@/components/react/shared/Modals";
import { useTranslate, useLocalizedPath } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";
import { Icon } from "@/components/react/shared/Icon";

interface EnvironmentDetailViewProps {
  spaceId: string | undefined;
  envId: string | undefined;
  envName: string;
  envDescription?: string;
  apiKey: string;
  createdAt?: string;
  initialLocale?: AvailableLanguages;
}


export default function EnvironmentDetailView({
  spaceId,
  envId,
  envName,
  envDescription,
  apiKey,
  createdAt,
  initialLocale,
}: EnvironmentDetailViewProps) {
  const t = useTranslate(initialLocale);
  const l = useLocalizedPath();
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [spaceName, setSpaceName] = useState("Space");
  const [currentApiKey, setCurrentApiKey] = useState(apiKey);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    fetchEnvironmentData();
  }, [envId, spaceId]);

  const fetchEnvironmentData = async () => {
    if (!envId || !spaceId) return;

    try {
      setIsLoading(true);
      const spaceResponse = await fetch(`/api/spaces/${spaceId}`, {
        credentials: "include",
      });
      if (spaceResponse.ok) {
        const spaceData = await spaceResponse.json();
        setSpaceName(spaceData.name || "Space");
      }
    } catch (error) {
      console.error("Failed to fetch environment data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!envId || !spaceId) return;

    try {
      setIsRegenerating(true);
      const response = await fetch(
        `/api/spaces/${spaceId}/environments/${envId}/regenerate-key`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (response.ok) {
        const updatedEnv = await response.json();
        setCurrentApiKey(updatedEnv.api_key);
      } else {
        console.error("Failed to regenerate API key");
      }
    } catch (error) {
      console.error("Error regenerating API key:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(currentApiKey).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 border-4 border-white/5 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
          {t('environmentDetail.syncing')}
        </p>
      </div>
    );
  }

  return (
    <>
      <PageContainer
        spaceId={spaceId}
        spaceName={spaceName}
        currentTab="environments"
        subPage={{ name: envName, path: `/spaces/${spaceId}/environments` }}
      >
        {/* Header Section */}
        <div className="mt-16 relative group overflow-hidden bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-[40px] p-8 md:p-14 animate-in slide-in-from-top-4 duration-1000">
          <div className="absolute top-0 right-0 w-full h-full bg-linear-to-br from-cyan-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-6 px-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                Environment Details
              </div>
              <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                {t('environmentDetail.stage', { name: envName })}
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed font-medium">
                {envDescription || t('environmentDetail.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start mt-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* API Configuration */}
            <div className="group relative bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[40px] p-8 md:p-12 transition-all duration-500 hover:bg-white/[0.04] hover:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden">
               <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/5 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="flex items-center gap-5 mb-12">
                <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-cyan-400/10 to-blue-600/10 flex items-center justify-center text-cyan-400 border border-cyan-500/10 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  <Icon name="Key" size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-white tracking-tight">
                    {t('environmentDetail.apiConfig')}
                  </h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                    {t('environmentDetail.authKeys')}
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">
                    {t('environmentDetail.envLabel')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={envName}
                      readOnly
                      className="w-full bg-slate-950/40 border border-white/5 rounded-2xl px-5 py-4 text-white font-medium cursor-default opacity-80"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">
                    {t('environmentDetail.apiSecretKey')}
                  </label>
                  {currentApiKey ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1 group/input">
                        <input
                          type="password"
                          value={currentApiKey}
                          readOnly
                          className="w-full bg-slate-950/40 border border-white/5 rounded-2xl px-5 py-4 text-white font-mono text-sm group-hover/input:border-white/10 transition-colors"
                        />
                         <div className="absolute inset-y-0 right-4 flex items-center">
                            <span className="text-slate-600 font-mono text-xs select-none">••••••••••••••••</span>
                         </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowApiKeyModal(true)}
                          className="flex items-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 border border-white/5"
                        >
                          <Icon name="Eye" size={16} />
                          {t('environmentDetail.reveal')}
                        </button>
                        <button
                          onClick={handleRegenerateKey}
                          disabled={isRegenerating}
                          className="flex items-center gap-2 px-6 py-4 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 border border-orange-500/20 disabled:opacity-50"
                        >
                          <Icon name="RefreshCw" size={16} />
                          {isRegenerating ? t('environmentDetail.wait') : t('environmentDetail.refresh')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleRegenerateKey}
                      disabled={isRegenerating}
                      className="w-full btn-primary py-4! shadow-xl shadow-cyan-500/20"
                    >
                      {isRegenerating ? t('environmentDetail.generating') : t('environmentDetail.generateApiKey')}
                    </button>
                  )}
                  <p className="text-[10px] font-bold bg-slate-50/5 text-slate-500 rounded-lg px-3 py-2 mt-4 inline-block uppercase tracking-wider">
                    ⚠️ {t('environmentDetail.securityWarning')}
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">
                    {t('environmentDetail.systemAccessPoint')}
                  </label>
                  <div className="relative group/input">
                    <input
                      type="text"
                      value={`https://easy-flags.orangeember.com/api/v1/envs/${envId}`}
                      readOnly
                      className="w-full bg-slate-950/40 border border-white/5 rounded-2xl px-5 py-4 text-cyan-500/80 font-mono text-sm group-hover/input:border-white/10 transition-colors"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`https://easy-flags.orangeember.com/api/v1/envs/${envId}`);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-600 hover:text-white transition-colors"
                      title="Copy URL"
                    >
                      <Icon name="Copy" size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Deployed Features */}
            <div className="group relative bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[40px] p-8 md:p-12 transition-all duration-500 hover:bg-white/[0.04] hover:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden">
               <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/5 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
               
               <div className="flex items-center gap-5 mb-12">
                <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-purple-400/10 to-pink-600/10 flex items-center justify-center text-purple-400 border border-purple-500/10 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  <Icon name="Rocket" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">
                    {t('environmentDetail.activeDeployments')}
                  </h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                    {t('environmentDetail.liveFeatures')}
                  </p>
                </div>
              </div>

              <div className="text-center py-20 bg-white/[0.01] border border-dashed border-white/10 rounded-[32px] relative z-10">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 text-slate-600 group-hover:scale-110 transition-transform duration-500">
                  <Icon name="Box" size={32} />
                </div>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest italic">
                  {t('environmentDetail.noFeatures')}
                </p>
                <div className="mt-8">
                  <a 
                    href={`/spaces/${spaceId}/features`} 
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/20 rounded-2xl text-cyan-400 text-xs font-black uppercase tracking-widest transition-all"
                  >
                    {t('environmentDetail.initializeFeature')}
                    <Icon name="Plus" size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8 lg:sticky lg:top-8 animate-in slide-in-from-right-4 duration-700 delay-300">
            {/* Environment Info */}
            <div className="group relative bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[40px] p-8 transition-all duration-500 hover:bg-white/[0.04] hover:border-white/10 shadow-2xl overflow-hidden">
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-slate-500/5 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

              <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/5 text-slate-400 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  <Icon name="Info" size={20} />
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">{t('environmentDetail.systemInfo')}</h3>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl group/sub">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.25em] mb-2 leading-none group-hover/sub:text-cyan-500/50 transition-colors">
                    {t('environmentDetail.digitalFingerprint')}
                  </p>
                  <p className="text-slate-400 font-mono text-xs break-all leading-relaxed whitespace-pre-wrap">{envId}</p>
                </div>

                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl group/sub">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.25em] mb-2 leading-none group-hover/sub:text-cyan-500/50 transition-colors">
                    {t('environmentDetail.originDate')}
                  </p>
                  <p className="text-slate-200 font-extrabold text-base tracking-tight">
                    {createdAt
                      ? new Date(createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Unknown"}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('environmentDetail.stageStatus')}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-wide">
                    {t('environmentDetail.activeTrafficDesc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions / Integration */}
            <div className="relative group overflow-hidden bg-linear-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-[40px] p-8 shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
              <h4 className="text-sm font-black text-white mb-4 uppercase tracking-[0.25em] relative z-10">{t('environmentDetail.connectSdk')}</h4>
              <p className="text-xs text-cyan-100/60 leading-relaxed mb-8 font-medium relative z-10">
                {t('environmentDetail.readyIntegrate')}
              </p>
              <a href={l("/docs")} className="block text-center w-full bg-white text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-50 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-cyan-500/20 relative z-10">
                {t('environmentDetail.readIntegrationDocs')}
              </a>
            </div>
          </div>
        </div>
      </PageContainer>

      {/* API Key Reveal Modal */}
      <Modal
        id="reveal-key-modal"
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        title={t('environmentDetail.accessPointSecret')}
      >
        <div className="space-y-8">
          <div className="text-center p-6 bg-slate-950/40 border border-white/5 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-cyan-500/50 to-transparent"></div>
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-4">{t('environmentDetail.yourApiKey')}</p>
            
            <div className="relative group/key">
              <div className="p-5 bg-black border border-white/5 rounded-2xl font-mono text-sm break-all text-cyan-400 pr-14 leading-relaxed">
                {currentApiKey}
              </div>
              <button
                onClick={handleCopyApiKey}
                className={`absolute top-1/2 -translate-y-1/2 right-3 p-3 rounded-xl transition-all ${
                  isCopied ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title="Copy to clipboard"
              >
                {isCopied ? <Icon name="Check" size={16} strokeWidth={3} /> : <Icon name="Copy" size={16} />}
              </button>
            </div>
          </div>

          <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 flex gap-4 items-start">
            <div className="mt-1 text-orange-500"><Icon name="Info" size={20} /></div>
            <div>
              <p className="text-orange-400 font-bold text-xs uppercase tracking-widest mb-1">{t('environmentDetail.securityNotice')}</p>
              <p className="text-[10px] text-orange-500/80 leading-relaxed font-medium">
                {t('environmentDetail.securityNoticeDesc')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowApiKeyModal(false)}
            className="w-full btn-primary py-4! shadow-xl shadow-cyan-500/20"
          >
            {t('environmentDetail.copied')}
          </button>
        </div>
      </Modal>
    </>
  );
}
