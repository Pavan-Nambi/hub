import grpc from '@grpc/grpc-js';
import * as flatbuffers from '@hub/flatbuffers';
import { Builder, ByteBuffer } from 'flatbuffers';
import MessageModel from '~/flatbuffers/models/messageModel';
import * as types from '~/flatbuffers/models/types';
import SyncEngine from '~/network/sync/syncEngine';
import { toMessagesResponse, toServiceError, toSyncIdsResponse, toTrieNodeMetadataResponse } from '~/rpc/server';
import Engine from '~/storage/engine';
import { HubError } from '~/utils/hubErrors';

export const syncImplementation = (engine: Engine, syncEngine: SyncEngine) => {
  return {
    getAllCastMessagesByFid: async (
      call: grpc.ServerUnaryCall<flatbuffers.GetAllMessagesByFidRequest, flatbuffers.MessagesResponse>,
      callback: grpc.sendUnaryData<flatbuffers.MessagesResponse>
    ) => {
      const result = await engine.getAllCastMessagesByFid(call.request.fidArray() ?? new Uint8Array());
      result.match(
        (messages: (types.CastAddModel | types.CastRemoveModel)[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getAllAmpMessagesByFid: async (
      call: grpc.ServerUnaryCall<flatbuffers.GetAllMessagesByFidRequest, flatbuffers.MessagesResponse>,
      callback: grpc.sendUnaryData<flatbuffers.MessagesResponse>
    ) => {
      const result = await engine.getAllAmpMessagesByFid(call.request.fidArray() ?? new Uint8Array());
      result.match(
        (messages: (types.AmpAddModel | types.AmpRemoveModel)[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getAllReactionMessagesByFid: async (
      call: grpc.ServerUnaryCall<flatbuffers.GetAllMessagesByFidRequest, flatbuffers.MessagesResponse>,
      callback: grpc.sendUnaryData<flatbuffers.MessagesResponse>
    ) => {
      const result = await engine.getAllReactionMessagesByFid(call.request.fidArray() ?? new Uint8Array());
      result.match(
        (messages: (types.ReactionAddModel | types.ReactionRemoveModel)[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getAllVerificationMessagesByFid: async (
      call: grpc.ServerUnaryCall<flatbuffers.GetAllMessagesByFidRequest, flatbuffers.MessagesResponse>,
      callback: grpc.sendUnaryData<flatbuffers.MessagesResponse>
    ) => {
      const result = await engine.getAllVerificationMessagesByFid(call.request.fidArray() ?? new Uint8Array());
      result.match(
        (messages: (types.VerificationAddEthAddressModel | types.VerificationRemoveModel)[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getAllSignerMessagesByFid: async (
      call: grpc.ServerUnaryCall<flatbuffers.GetAllMessagesByFidRequest, flatbuffers.MessagesResponse>,
      callback: grpc.sendUnaryData<flatbuffers.MessagesResponse>
    ) => {
      const result = await engine.getAllSignerMessagesByFid(call.request.fidArray() ?? new Uint8Array());
      result.match(
        (messages: (types.SignerAddModel | types.SignerRemoveModel)[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getAllUserDataMessagesByFid: async (
      call: grpc.ServerUnaryCall<flatbuffers.GetAllMessagesByFidRequest, flatbuffers.MessagesResponse>,
      callback: grpc.sendUnaryData<flatbuffers.MessagesResponse>
    ) => {
      const result = await engine.getUserDataByFid(call.request.fidArray() ?? new Uint8Array());
      result.match(
        (messages: types.UserDataAddModel[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getAllSyncIdsByPrefix: async (
      call: grpc.ServerUnaryCall<flatbuffers.GetTrieNodesByPrefixRequest, flatbuffers.GetAllSyncIdsByPrefixResponse>,
      callback: grpc.sendUnaryData<flatbuffers.GetAllSyncIdsByPrefixResponse>
    ) => {
      const result = syncEngine.getIdsByPrefix(
        new TextDecoder().decode(call.request.prefixArray() ?? new Uint8Array())
      );
      callback(null, toSyncIdsResponse(result));
    },

    getAllMessagesBySyncIds: async (
      call: grpc.ServerUnaryCall<flatbuffers.GetAllMessagesBySyncIdsRequest, flatbuffers.MessagesResponse>,
      callback: grpc.sendUnaryData<flatbuffers.MessagesResponse>
    ) => {
      const syncIdHashes: string[] = [];
      for (let i = 0; i < call.request.syncIdsLength(); i++) {
        syncIdHashes.push(new TextDecoder().decode(call.request.syncIds(i)?.syncIdHashArray() ?? new Uint8Array()));
      }

      const result = await engine.getAllMessagesBySyncIds(syncIdHashes);
      result.match(
        (messages: MessageModel[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getSyncMetadataByPrefix: async (
      call: grpc.ServerUnaryCall<flatbuffers.GetTrieNodesByPrefixRequest, flatbuffers.TrieNodeMetadataResponse>,
      callback: grpc.sendUnaryData<flatbuffers.TrieNodeMetadataResponse>
    ) => {
      const prefix = new TextDecoder().decode(call.request.prefixArray() ?? new Uint8Array());
      const result = syncEngine.getTrieNodeMetadata(prefix);
      if (result) {
        callback(null, toTrieNodeMetadataResponse(result));
      } else {
        const err = new HubError('bad_request', 'Failed to get trie node metadata');
        callback(toServiceError(err));
      }
    },
  };
};

export const createSyncServiceRequest = (fid: Uint8Array): flatbuffers.GetAllMessagesByFidRequest => {
  const builder = new Builder(1);
  const requestT = new flatbuffers.GetAllMessagesByFidRequestT(Array.from(fid));
  builder.finish(requestT.pack(builder));
  return flatbuffers.GetAllMessagesByFidRequest.getRootAsGetAllMessagesByFidRequest(
    new ByteBuffer(builder.asUint8Array())
  );
};

export const createByPrefixRequest = (prefix: Uint8Array): flatbuffers.GetTrieNodesByPrefixRequest => {
  const builder = new Builder(1);
  const requestT = new flatbuffers.GetTrieNodesByPrefixRequestT(Array.from(prefix));
  builder.finish(requestT.pack(builder));
  return flatbuffers.GetTrieNodesByPrefixRequest.getRootAsGetTrieNodesByPrefixRequest(
    new ByteBuffer(builder.asUint8Array())
  );
};

export const createAllMessagesByHashesRequest = (hashes: Uint8Array[]): flatbuffers.GetAllMessagesBySyncIdsRequest => {
  const hashes_list = hashes.map((hash) => new flatbuffers.SyncIdHashT(Array.from(hash)));

  const builder = new Builder(1);
  const hashesT = new flatbuffers.GetAllMessagesBySyncIdsRequestT(hashes_list);
  builder.finish(hashesT.pack(builder));
  return flatbuffers.GetAllMessagesBySyncIdsRequest.getRootAsGetAllMessagesBySyncIdsRequest(
    new ByteBuffer(builder.asUint8Array())
  );
};
