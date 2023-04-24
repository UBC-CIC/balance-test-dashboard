from __future__ import absolute_import, division, print_function

import argparse
import json
import logging as _logging
import os
import sys as _sys

from PIL import Image
# load and display an image with Matplotlib
from matplotlib import image as im
import matplotlib.pyplot as plt
import pandas as pd
from math import floor
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers,models
from tensorflow.keras.layers import LSTM
from tensorflow.python.platform import tf_logging
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics import confusion_matrix


def lstm_model_fn():
    """Model function for LSTM."""
    mirrored_strategy = tf.distribute.MirroredStrategy()

    with mirrored_strategy.scope():
        model = models.Sequential()
        model.add(LSTM(50, activation='relu', input_shape=(1,900)))
        model.add(layers.Dense(10,activation='sigmoid'))
        model.add(layers.Dense(1,activation='sigmoid'))
        model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=args.learning_rate),loss=tf.keras.losses.MeanSquaredError())

    return(model)

def _load_training_data(base_dir):
    all_sits={}
    scores={}
#     folder_name=base_dir
    #Look at all json files within this folder and use them for training
    all_json_files=[]
    for path, subdirs, files in os.walk(base_dir):
        for name in files:
            pos_json=os.path.join(path, name)
            if pos_json.endswith('.json'):
                all_json_files.append(pos_json)
    print(all_json_files)
#     print("Listing Directories",os.listdir(folder_name))
    i=0
    for json_file in all_json_files:
        df = pd.read_json(json_file)
        assert np.unique(df['training'])==[True]
        all_sits[i]=df[['ts','ax','ay','az','gx','gy','gz','mx','my','mz']]
        scores[i]=np.unique(df['clinic_score'])[0]
        i+=1
        
    num_training_files= len(all_json_files)
    X=np.empty((num_training_files,900))
    y=[]
    
    from scipy.signal import stft
    from heapq import nlargest
    from heapq import nsmallest
    ax_stft={}
    ax_stft_largest={}
    ax_stft_smallest={}
    ay_stft={}
    ay_stft_largest={}
    ay_stft_smallest={}
    az_stft={}
    az_stft_largest={}
    az_stft_smallest={}
    gx_stft={}
    gx_stft_largest={}
    gx_stft_smallest={}
    gy_stft={}
    gy_stft_largest={}
    gy_stft_smallest={}
    gz_stft={}
    gz_stft_largest={}
    gz_stft_smallest={}
    mx_stft={}
    mx_stft_largest={}
    mx_stft_smallest={}
    my_stft={}
    my_stft_largest={}
    my_stft_smallest={}
    mz_stft={}
    mz_stft_largest={}
    mz_stft_smallest={}
    for i in range(num_training_files):
        
        nperseg = 512
        
        if (len(all_sits[i]['ax']) < nperseg):
            
            pad_length = (nperseg-len(all_sits[i]['ax']))//2 + 1
            ax_stft[i]=np.abs(stft(np.pad(all_sits[i]['ax'],(pad_length,),'median'),nperseg=nperseg,fs=1)[2]**2)
            ay_stft[i]=np.abs(stft(np.pad(all_sits[i]['ay'],(pad_length,),'median'),nperseg=nperseg,fs=1)[2]**2)
            az_stft[i]=np.abs(stft(np.pad(all_sits[i]['az'],(pad_length,),'median'),nperseg=nperseg,fs=1)[2]**2)
            ax_stft_largest[i]=nlargest(50,ax_stft[i].flatten())
            ax_stft_smallest[i]=nsmallest(50,ax_stft[i].flatten())
            ay_stft_largest[i]=nlargest(50,ay_stft[i].flatten())
            ay_stft_smallest[i]=nsmallest(50,ay_stft[i].flatten())
            az_stft_largest[i]=nlargest(50,az_stft[i].flatten())
            az_stft_smallest[i]=nsmallest(50,az_stft[i].flatten())
            gx_stft[i]=np.abs(stft(np.pad(all_sits[i]['gx'],(pad_length,),'median'),nperseg=nperseg,fs=1)[2]**2)
            gy_stft[i]=np.abs(stft(np.pad(all_sits[i]['gy'],(pad_length,),'median'),nperseg=nperseg,fs=1)[2]**2)
            gz_stft[i]=np.abs(stft(np.pad(all_sits[i]['gz'],(pad_length,),'median'),nperseg=nperseg,fs=1)[2]**2)
            gx_stft_largest[i]=nlargest(50,gx_stft[i].flatten())
            gx_stft_smallest[i]=nsmallest(50,gx_stft[i].flatten())
            gy_stft_largest[i]=nlargest(50,gy_stft[i].flatten())
            gy_stft_smallest[i]=nsmallest(50,gy_stft[i].flatten())
            gz_stft_largest[i]=nlargest(50,gz_stft[i].flatten())
            gz_stft_smallest[i]=nsmallest(50,gz_stft[i].flatten())
            mx_stft[i]=np.abs(stft(np.pad(all_sits[i]['mx'],(pad_length,),'median'),nperseg=nperseg,fs=1)[2]**2)
            my_stft[i]=np.abs(stft(np.pad(all_sits[i]['my'],(pad_length,),'median'),nperseg=nperseg,fs=1)[2]**2)
            mz_stft[i]=np.abs(stft(np.pad(all_sits[i]['mz'],(pad_length,),'median'),nperseg=nperseg,fs=1)[2]**2)
            mx_stft_largest[i]=nlargest(50,mx_stft[i].flatten())
            mx_stft_smallest[i]=nsmallest(50,mx_stft[i].flatten())
            my_stft_largest[i]=nlargest(50,my_stft[i].flatten())
            my_stft_smallest[i]=nsmallest(50,my_stft[i].flatten())
            mz_stft_largest[i]=nlargest(50,mz_stft[i].flatten())
            mz_stft_smallest[i]=nsmallest(50,mz_stft[i].flatten())

        else:
            ax_stft[i]=np.abs(stft(all_sits[i]['ax'],nperseg=nperseg,fs=1)[2]**2)
            ay_stft[i]=np.abs(stft(all_sits[i]['ay'],nperseg=nperseg,fs=1)[2]**2)
            az_stft[i]=np.abs(stft(all_sits[i]['az'],nperseg=nperseg,fs=1)[2]**2)
            ax_stft_largest[i]=nlargest(50,ax_stft[i].flatten())
            ax_stft_smallest[i]=nsmallest(50,ax_stft[i].flatten())
            ay_stft_largest[i]=nlargest(50,ay_stft[i].flatten())
            ay_stft_smallest[i]=nsmallest(50,ay_stft[i].flatten())
            az_stft_largest[i]=nlargest(50,az_stft[i].flatten())
            az_stft_smallest[i]=nsmallest(50,az_stft[i].flatten())
            gx_stft[i]=np.abs(stft(all_sits[i]['gx'],nperseg=nperseg,fs=1)[2]**2)
            gy_stft[i]=np.abs(stft(all_sits[i]['gy'],nperseg=nperseg,fs=1)[2]**2)
            gz_stft[i]=np.abs(stft(all_sits[i]['gz'],nperseg=nperseg,fs=1)[2]**2)
            gx_stft_largest[i]=nlargest(50,gx_stft[i].flatten())
            gx_stft_smallest[i]=nsmallest(50,gx_stft[i].flatten())
            gy_stft_largest[i]=nlargest(50,gy_stft[i].flatten())
            gy_stft_smallest[i]=nsmallest(50,gy_stft[i].flatten())
            gz_stft_largest[i]=nlargest(50,gz_stft[i].flatten())
            gz_stft_smallest[i]=nsmallest(50,gz_stft[i].flatten())
            mx_stft[i]=np.abs(stft(all_sits[i]['mx'],nperseg=nperseg,fs=1)[2]**2)
            my_stft[i]=np.abs(stft(all_sits[i]['my'],nperseg=nperseg,fs=1)[2]**2)
            mz_stft[i]=np.abs(stft(all_sits[i]['mz'],nperseg=nperseg,fs=1)[2]**2)
            mx_stft_largest[i]=nlargest(50,mx_stft[i].flatten())
            mx_stft_smallest[i]=nsmallest(50,mx_stft[i].flatten())
            my_stft_largest[i]=nlargest(50,my_stft[i].flatten())
            my_stft_smallest[i]=nsmallest(50,my_stft[i].flatten())
            mz_stft_largest[i]=nlargest(50,mz_stft[i].flatten())
            mz_stft_smallest[i]=nsmallest(50,mz_stft[i].flatten())
            
        X[i-1][:] = [*ax_stft_largest[i], *ax_stft_smallest[i], *ay_stft_largest[i], *ay_stft_smallest[i], *az_stft_largest[i], *az_stft_smallest[i], *gx_stft_largest[i], *gx_stft_smallest[i], *gy_stft_largest[i], *gy_stft_smallest[i], *gz_stft_largest[i], *gz_stft_smallest[i],*mx_stft_largest[i], *mx_stft_smallest[i], *my_stft_largest[i], *my_stft_smallest[i], *mz_stft_largest[i], *mz_stft_smallest[i]]
        y.append(scores[i])
    return(X,y)

def _parse_args():

    parser = argparse.ArgumentParser()

    #these arguments are always automatically passed by sagemaker, so the following block of code should essentially stay as is in your code.
    # Data, model, and output directories
    # model_dir is always passed in from SageMaker. 
    #By default this is a S3 path under the default bucket.
    parser.add_argument("--model_dir", type=str)
    parser.add_argument("--sm_model_dir", type=str, default=os.environ.get("SM_MODEL_DIR"))
    parser.add_argument("--train", type=str, default=os.environ.get("SM_CHANNEL_TRAINING"))
    parser.add_argument("--hosts", type=list, default=json.loads(os.environ.get("SM_HOSTS")))
    parser.add_argument("--current-host", type=str, default=os.environ.get("SM_CURRENT_HOST"))
    
    #passed manually, you can add whatever custom arguments you want and pass them through the Jupyter notebook.
    parser.add_argument('--epochs',        type=int,   default=10)
    parser.add_argument('--learning_rate', type=float, default=0.001)
    parser.add_argument('--batch_size',    type=int,   default=32)

    return parser.parse_known_args()



if __name__ == "__main__":
    args, unknown = _parse_args()

    X,Y=_load_training_data(args.train)
    print("Data Loaded")
    
    Y = np.array(Y)
    X = np.reshape(X,(X.shape[0],1,X.shape[1]))
#     X = np.array(X)

    print("X Shape", X.shape)
    
    model = lstm_model_fn()
    print(model.summary())
    X_train=X
    Y_train=Y
    from tensorflow.keras.callbacks import EarlyStopping
    es = EarlyStopping(monitor = 'val_loss', mode = 'min', verbose = 1, patience = 15)
#     print(tf.config.get_memory_usage()['current'])
#     model.save('model_tmp')
    history = model.fit(X_train, Y_train, epochs=args.epochs,batch_size=args.batch_size,verbose=2,callbacks=[es])
    model.save(f'{args.model_dir}/1')
#     Y_pred = model.predict(X_test)
#     preds=[floor(2*x) for x in Y_pred]
#     print("Results on same patient")
#     print(preds)
#     print(Y_test)
#     print(confusion_matrix(Y_test,preds))
    

# TODO: uncomment and remove the above section when fixed

# from __future__ import absolute_import, division, print_function

# import argparse
# import json
# import logging as _logging
# import os
# import sys as _sys

# from PIL import Image
# # load and display an image with Matplotlib
# from matplotlib import image as im
# import matplotlib.pyplot as plt
# import pandas as pd
# from math import floor
# import numpy as np
# import tensorflow as tf
# from tensorflow.keras import layers,models
# from tensorflow.keras.layers import LSTM
# from tensorflow.python.platform import tf_logging
# from sklearn.preprocessing import OneHotEncoder
# from sklearn.metrics import confusion_matrix


# def lstm_model_fn():
#     """Model function for LSTM."""
#     mirrored_strategy = tf.distribute.MirroredStrategy()

#     with mirrored_strategy.scope():
#         model = models.Sequential()
#         model.add(LSTM(50, activation='relu', input_shape=(None,900)))
#         model.add(layers.Dense(10,activation='sigmoid'))
#         model.add(layers.Dense(1,activation='sigmoid'))
#         model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=args.learning_rate),loss=tf.keras.losses.MeanSquaredError())

#     return(model)

# def _load_training_data(base_dir):
#     all_sits={}
#     scores={}
# #     folder_name=base_dir
#     #Look at all json files within this folder and use them for training
#     all_json_files=[]
#     for path, subdirs, files in os.walk(base_dir):
#         for name in files:
#             pos_json=os.path.join(path, name)
#             if pos_json.endswith('.json'):
#                 all_json_files.append(pos_json)
#     print(all_json_files)
# #     print("Listing Directories",os.listdir(folder_name))
#     i=0
#     for json_file in all_json_files:
#         df = pd.read_json(json_file)
#         assert np.unique(df['training'])==[True]
#         all_sits[i]=df[['ts','ax','ay','az','gx','gy','gz','mx','my','mz']]
#         scores[i]=np.unique(df['clinic_score'])[0]
#         i+=1
        
#     num_training_files= len(all_json_files)
#     X=np.empty((num_training_files,900))
#     y=[]
    
#     from scipy.signal import stft
#     from heapq import nlargest
#     from heapq import nsmallest
#     ax_stft={}
#     ax_stft_largest={}
#     ax_stft_smallest={}
#     ay_stft={}
#     ay_stft_largest={}
#     ay_stft_smallest={}
#     az_stft={}
#     az_stft_largest={}
#     az_stft_smallest={}
#     gx_stft={}
#     gx_stft_largest={}
#     gx_stft_smallest={}
#     gy_stft={}
#     gy_stft_largest={}
#     gy_stft_smallest={}
#     gz_stft={}
#     gz_stft_largest={}
#     gz_stft_smallest={}
#     mx_stft={}
#     mx_stft_largest={}
#     mx_stft_smallest={}
#     my_stft={}
#     my_stft_largest={}
#     my_stft_smallest={}
#     mz_stft={}
#     mz_stft_largest={}
#     mz_stft_smallest={}
#     for i in range(num_training_files):
# #         pad_length = (2000-len(all_sits[i]['ax']))//2
#         ax_stft[i]=np.abs(stft(all_sits[i]['ax'],nperseg=512,fs=1)[2]**2)
#         ay_stft[i]=np.abs(stft(all_sits[i]['ay'],nperseg=512,fs=1)[2]**2)
#         az_stft[i]=np.abs(stft(all_sits[i]['az'],nperseg=512,fs=1)[2]**2)
#         ax_stft_largest[i]=nlargest(50,ax_stft[i].flatten())
#         ax_stft_smallest[i]=nsmallest(50,ax_stft[i].flatten())
#         ay_stft_largest[i]=nlargest(50,ay_stft[i].flatten())
#         ay_stft_smallest[i]=nsmallest(50,ay_stft[i].flatten())
#         az_stft_largest[i]=nlargest(50,az_stft[i].flatten())
#         az_stft_smallest[i]=nsmallest(50,az_stft[i].flatten())
#         gx_stft[i]=np.abs(stft(all_sits[i]['gx'],nperseg=512,fs=1)[2]**2)
#         gy_stft[i]=np.abs(stft(all_sits[i]['gy'],nperseg=512,fs=1)[2]**2)
#         gz_stft[i]=np.abs(stft(all_sits[i]['gz'],nperseg=512,fs=1)[2]**2)
#         gx_stft_largest[i]=nlargest(50,gx_stft[i].flatten())
#         gx_stft_smallest[i]=nsmallest(50,gx_stft[i].flatten())
#         gy_stft_largest[i]=nlargest(50,gy_stft[i].flatten())
#         gy_stft_smallest[i]=nsmallest(50,gy_stft[i].flatten())
#         gz_stft_largest[i]=nlargest(50,gz_stft[i].flatten())
#         gz_stft_smallest[i]=nsmallest(50,gz_stft[i].flatten())
#         mx_stft[i]=np.abs(stft(all_sits[i]['mx'],nperseg=512,fs=1)[2]**2)
#         my_stft[i]=np.abs(stft(all_sits[i]['my'],nperseg=512,fs=1)[2]**2)
#         mz_stft[i]=np.abs(stft(all_sits[i]['mz'],nperseg=512,fs=1)[2]**2)
#         mx_stft_largest[i]=nlargest(50,mx_stft[i].flatten())
#         mx_stft_smallest[i]=nsmallest(50,mx_stft[i].flatten())
#         my_stft_largest[i]=nlargest(50,my_stft[i].flatten())
#         my_stft_smallest[i]=nsmallest(50,my_stft[i].flatten())
#         mz_stft_largest[i]=nlargest(50,mz_stft[i].flatten())
#         mz_stft_smallest[i]=nsmallest(50,mz_stft[i].flatten())
#         X[i-1][:] = [*ax_stft_largest[i], *ax_stft_smallest[i], *ay_stft_largest[i], *ay_stft_smallest[i], *az_stft_largest[i], *az_stft_smallest[i], *gx_stft_largest[i], *gx_stft_smallest[i], *gy_stft_largest[i], *gy_stft_smallest[i], *gz_stft_largest[i], *gz_stft_smallest[i],*mx_stft_largest[i], *mx_stft_smallest[i], *my_stft_largest[i], *my_stft_smallest[i], *mz_stft_largest[i], *mz_stft_smallest[i]]
#         y.append(scores[i])
#     return(X,y)

# def _parse_args():

#     parser = argparse.ArgumentParser()

#     #these arguments are always automatically passed by sagemaker, so the following block of code should essentially stay as is in your code.
#     # Data, model, and output directories
#     # model_dir is always passed in from SageMaker. 
#     #By default this is a S3 path under the default bucket.
#     parser.add_argument("--model_dir", type=str)
#     parser.add_argument("--sm_model_dir", type=str, default=os.environ.get("SM_MODEL_DIR"))
#     parser.add_argument("--train", type=str, default=os.environ.get("SM_CHANNEL_TRAINING"))
#     parser.add_argument("--hosts", type=list, default=json.loads(os.environ.get("SM_HOSTS")))
#     parser.add_argument("--current-host", type=str, default=os.environ.get("SM_CURRENT_HOST"))
    
#     #passed manually, you can add whatever custom arguments you want and pass them through the Jupyter notebook.
#     parser.add_argument('--epochs',        type=int,   default=10)
#     parser.add_argument('--learning_rate', type=float, default=0.001)
#     parser.add_argument('--batch_size',    type=int,   default=32)

#     return parser.parse_known_args()



# if __name__ == "__main__":
#     args, unknown = _parse_args()

#     X,Y=_load_training_data(args.train)
#     print("Data Loaded")
    
#     Y = np.array(Y)
#     X = np.reshape(X,(X.shape[0],1,X.shape[1]))
# #     X = np.array(X)

#     print("X Shape", X.shape)
    
#     model = lstm_model_fn()
#     print(model.summary())
#     X_train=X
#     Y_train=Y
#     from tensorflow.keras.callbacks import EarlyStopping
#     es = EarlyStopping(monitor = 'val_loss', mode = 'min', verbose = 1, patience = 15)
# #     print(tf.config.get_memory_usage()['current'])
# #     model.save('model_tmp')
#     history = model.fit(X_train, Y_train, epochs=args.epochs,batch_size=args.batch_size,verbose=2,callbacks=[es])
#     model.save(f'{args.model_dir}/1')
# #     Y_pred = model.predict(X_test)
# #     preds=[floor(2*x) for x in Y_pred]
# #     print("Results on same patient")
# #     print(preds)
# #     print(Y_test)
# #     print(confusion_matrix(Y_test,preds))
    
   